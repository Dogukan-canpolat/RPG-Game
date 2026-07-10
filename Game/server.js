const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const usersFile = path.join(dataDir, "users.json");
const sqliteFile = path.join(dataDir, "game.db");
const sqliteBackupFile = path.join(dataDir, "users.backup-before-sqlite.json");
const port = Number(process.env.PORT) || 5173;
const host = "127.0.0.1";
const sessions = new Map();
let database = null;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".webp": "image/webp",
};

function getDatabase() {
  if (database) return database;
  database = new DatabaseSync(sqliteFile);
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS characters (
      username TEXT PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
      save_data TEXT,
      level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      xp_to_next INTEGER NOT NULL DEFAULT 100,
      health REAL NOT NULL DEFAULT 120,
      max_health REAL NOT NULL DEFAULT 120,
      damage REAL NOT NULL DEFAULT 15,
      attack_speed REAL NOT NULL DEFAULT 1.15,
      gold INTEGER NOT NULL DEFAULT 0,
      stage INTEGER NOT NULL DEFAULT 1,
      max_unlocked_stage INTEGER NOT NULL DEFAULT 1,
      kills_since_loot INTEGER NOT NULL DEFAULT 0,
      sound_enabled INTEGER NOT NULL DEFAULT 1,
      save_version INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      uid TEXT NOT NULL,
      item_id TEXT,
      item_name TEXT,
      item_type TEXT,
      slot TEXT,
      tier INTEGER NOT NULL DEFAULT 1,
      quantity INTEGER NOT NULL DEFAULT 1,
      locked INTEGER NOT NULL DEFAULT 0,
      source TEXT,
      item_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS equipped_items (
      username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      slot TEXT NOT NULL,
      item_uid TEXT,
      item_json TEXT NOT NULL,
      PRIMARY KEY (username, slot)
    );

    CREATE TABLE IF NOT EXISTS bestiary (
      username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      enemy_name TEXT NOT NULL,
      kills INTEGER NOT NULL DEFAULT 0,
      drops INTEGER NOT NULL DEFAULT 0,
      highest_level INTEGER NOT NULL DEFAULT 0,
      last_drop TEXT,
      PRIMARY KEY (username, enemy_name)
    );

    CREATE TABLE IF NOT EXISTS shop_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      stock_id TEXT,
      item_id TEXT,
      item_name TEXT,
      tier INTEGER NOT NULL DEFAULT 1,
      cost INTEGER NOT NULL DEFAULT 0,
      item_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_inventory_username ON inventory_items(username);
    CREATE INDEX IF NOT EXISTS idx_shop_stock_username ON shop_stock(username);
    CREATE INDEX IF NOT EXISTS idx_characters_leaderboard ON characters(level DESC, stage DESC);
  `);
  return database;
}

async function readJsonUsers() {
  try {
    const text = (await fs.readFile(usersFile, "utf8")).replace(/^\uFEFF/, "");
    return text.trim() ? JSON.parse(text) : {};
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

function parseJsonField(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getCharacterSummary(saveData) {
  const hero = saveData?.hero || {};
  return {
    level: Number(hero.level) || 1,
    xp: Number(hero.xp) || 0,
    xpToNext: Number(hero.xpToNext) || 100,
    health: Number(hero.health) || 120,
    maxHealth: Number(hero.maxHealth) || 120,
    damage: Number(hero.damage) || 15,
    attackSpeed: Number(hero.attackSpeed) || 1.15,
    gold: Number(saveData?.gold) || 0,
    stage: Number(saveData?.stage?.current || saveData?.wave) || 1,
    maxUnlockedStage: Number(saveData?.maxUnlockedLevel || saveData?.stage?.current || saveData?.wave) || 1,
    killsSinceLoot: Number(saveData?.killsSinceLoot) || 0,
    soundEnabled: saveData?.soundEnabled !== false ? 1 : 0,
    saveVersion: Number(saveData?.saveVersion) || 1,
  };
}

function syncCharacterTables(db, username, saveData) {
  db.prepare("DELETE FROM inventory_items WHERE username = ?").run(username);
  db.prepare("DELETE FROM equipped_items WHERE username = ?").run(username);
  db.prepare("DELETE FROM bestiary WHERE username = ?").run(username);
  db.prepare("DELETE FROM shop_stock WHERE username = ?").run(username);

  if (!saveData) return;

  const inventoryStatement = db.prepare(`
    INSERT INTO inventory_items
      (username, uid, item_id, item_name, item_type, slot, tier, quantity, locked, source, item_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of Array.isArray(saveData.inventory) ? saveData.inventory : []) {
    inventoryStatement.run(
      username,
      String(item.uid || crypto.randomUUID()),
      item.id || "",
      item.name || "",
      item.type || "",
      item.slot || "",
      Number(item.tier) || 1,
      Number(item.quantity) || 1,
      item.locked ? 1 : 0,
      item.source || "",
      JSON.stringify(item),
    );
  }

  const equippedStatement = db.prepare(`
    INSERT INTO equipped_items (username, slot, item_uid, item_json)
    VALUES (?, ?, ?, ?)
  `);
  for (const [slot, item] of Object.entries(saveData.equipped || {})) {
    equippedStatement.run(username, slot, item?.uid || "", JSON.stringify(item || {}));
  }

  const bestiaryStatement = db.prepare(`
    INSERT INTO bestiary (username, enemy_name, kills, drops, highest_level, last_drop)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const [enemyName, entry] of Object.entries(saveData.bestiary || {})) {
    bestiaryStatement.run(
      username,
      enemyName,
      Number(entry.kills) || 0,
      Number(entry.drops) || 0,
      Number(entry.highestLevel) || 0,
      entry.lastDrop || "",
    );
  }

  const shopStatement = db.prepare(`
    INSERT INTO shop_stock (username, stock_id, item_id, item_name, tier, cost, item_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of Array.isArray(saveData.shopStock) ? saveData.shopStock : []) {
    shopStatement.run(
      username,
      item.stockId || "",
      item.id || "",
      item.name || "",
      Number(item.tier) || 1,
      Number(item.cost) || 0,
      JSON.stringify(item),
    );
  }
}

function upsertUsers(db, users) {
  const insertUser = db.prepare(`
    INSERT INTO users (username, password_salt, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET
      password_salt = excluded.password_salt,
      password_hash = excluded.password_hash,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at
  `);
  const insertCharacter = db.prepare(`
    INSERT INTO characters
      (username, save_data, level, xp, xp_to_next, health, max_health, damage, attack_speed, gold, stage,
       max_unlocked_stage, kills_since_loot, sound_enabled, save_version, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET
      save_data = excluded.save_data,
      level = excluded.level,
      xp = excluded.xp,
      xp_to_next = excluded.xp_to_next,
      health = excluded.health,
      max_health = excluded.max_health,
      damage = excluded.damage,
      attack_speed = excluded.attack_speed,
      gold = excluded.gold,
      stage = excluded.stage,
      max_unlocked_stage = excluded.max_unlocked_stage,
      kills_since_loot = excluded.kills_since_loot,
      sound_enabled = excluded.sound_enabled,
      save_version = excluded.save_version,
      updated_at = excluded.updated_at
  `);

  for (const user of Object.values(users)) {
    const username = normalizeUsername(user.username);
    if (!username) continue;
    const now = new Date().toISOString();
    const createdAt = user.createdAt || now;
    const updatedAt = user.updatedAt || createdAt;
    const saveData = user.saveData || null;
    const summary = getCharacterSummary(saveData);

    insertUser.run(username, user.passwordSalt || "", user.passwordHash || "", createdAt, updatedAt);
    insertCharacter.run(
      username,
      saveData ? JSON.stringify(saveData) : null,
      summary.level,
      summary.xp,
      summary.xpToNext,
      summary.health,
      summary.maxHealth,
      summary.damage,
      summary.attackSpeed,
      summary.gold,
      summary.stage,
      summary.maxUnlockedStage,
      summary.killsSinceLoot,
      summary.soundEnabled,
      summary.saveVersion,
      updatedAt,
    );
    syncCharacterTables(db, username, saveData);
  }
}

async function ensureDatabase() {
  await fs.mkdir(dataDir, { recursive: true });
  const db = getDatabase();
  const row = db.prepare("SELECT COUNT(*) AS count FROM users").get();
  if (Number(row.count) > 0) return;

  const jsonUsers = await readJsonUsers();
  if (Object.keys(jsonUsers).length === 0) return;

  try {
    await fs.access(sqliteBackupFile);
  } catch {
    await fs.copyFile(usersFile, sqliteBackupFile);
  }

  db.exec("BEGIN IMMEDIATE;");
  try {
    upsertUsers(db, jsonUsers);
    db.exec("COMMIT;");
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }
}

async function readUsers() {
  await ensureDatabase();
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT
      users.username,
      users.password_salt,
      users.password_hash,
      users.created_at,
      users.updated_at,
      characters.save_data
    FROM users
    LEFT JOIN characters ON characters.username = users.username
    ORDER BY users.username
  `).all();

  return Object.fromEntries(rows.map((row) => [
    row.username,
    {
      username: row.username,
      passwordSalt: row.password_salt,
      passwordHash: row.password_hash,
      saveData: parseJsonField(row.save_data, null),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  ]));
}

async function writeUsers(users) {
  await ensureDatabase();
  const db = getDatabase();
  db.exec("BEGIN IMMEDIATE;");
  try {
    db.prepare("DELETE FROM shop_stock").run();
    db.prepare("DELETE FROM bestiary").run();
    db.prepare("DELETE FROM equipped_items").run();
    db.prepare("DELETE FROM inventory_items").run();
    db.prepare("DELETE FROM characters").run();
    db.prepare("DELETE FROM users").run();
    upsertUsers(db, users);
    db.exec("COMMIT;");
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("base64")) {
  const hash = crypto.createHash("sha256").update(salt).update(String(password)).digest("base64");
  return { salt, hash };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readRequestJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 2_000_000) throw new Error("Istek cok buyuk.");
  }
  return body ? JSON.parse(body) : {};
}

function publicUser(user) {
  return {
    username: user.username,
    saveData: user.saveData || null,
  };
}

function getItemStat(item, key) {
  return Number(item?.[key]) || 0;
}

function getSavePower(saveData) {
  if (!saveData?.hero) return 0;
  const hero = saveData.hero;
  const equipped = Object.values(saveData.equipped || {});
  const talents = hero.talents || {};
  const damage = getItemStat(hero, "damage") + equipped.reduce((sum, item) => sum + getItemStat(item, "damage"), 0);
  const health = getItemStat(hero, "maxHealth") + (Number(talents.healthBonus) || 0) * 5 + equipped.reduce((sum, item) => sum + getItemStat(item, "maxHealth"), 0);
  const speed = getItemStat(hero, "attackSpeed") + equipped.reduce((sum, item) => sum + getItemStat(item, "attackSpeed"), 0);
  const criticalChance = Math.min(0.5, 0.12 + equipped.reduce((sum, item) => sum + getItemStat(item, "criticalChance"), 0));
  const talentPower = (Number(talents.criticalDamage) || 0) * 8 + (Number(talents.luck) || 0) * 5 + (Number(talents.shopDiscount) || 0) * 4;
  return Math.round((Number(hero.level) || 1) * 85 + damage * 14 + health * 0.85 + speed * 140 + criticalChance * 900 + talentPower);
}

function leaderboardUsers(users) {
  return Object.values(users)
    .map((user) => ({
      username: user.username,
      level: Number(user.saveData?.hero?.level) || 1,
      wave: Number(user.saveData?.stage?.current || user.saveData?.wave) || 1,
      power: getSavePower(user.saveData),
      updatedAt: user.updatedAt || user.createdAt || "",
    }))
    .sort((a, b) => b.level - a.level || b.power - a.power || b.wave - a.wave)
    .slice(0, 20);
}

function createSession(username) {
  const token = crypto.randomBytes(24).toString("base64url");
  sessions.set(token, username);
  return token;
}

function isValidSession(username, token) {
  return Boolean(token && sessions.get(token) === username);
}

async function handleApi(request, response) {
  try {
    const users = await readUsers();

    if (request.url === "/api/leaderboard" && request.method === "GET") {
      sendJson(response, 200, { leaderboard: leaderboardUsers(users) });
      return;
    }

    const body = await readRequestJson(request);
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");

    if (request.url === "/api/register" && request.method === "POST") {
      if (username.length < 3 || password.length < 4) {
        sendJson(response, 400, { error: "Kullanici adi en az 3, sifre en az 4 karakter olmali." });
        return;
      }
      if (users[username]) {
        sendJson(response, 409, { error: "Bu kullanici adi zaten var." });
        return;
      }
      const passwordData = hashPassword(password);
      users[username] = {
        username,
        passwordSalt: passwordData.salt,
        passwordHash: passwordData.hash,
        saveData: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await writeUsers(users);
      sendJson(response, 201, { user: publicUser(users[username]), token: createSession(username) });
      return;
    }

    if (request.url === "/api/login" && request.method === "POST") {
      const user = users[username];
      if (!user) {
        sendJson(response, 404, { error: "Kullanici bulunamadi." });
        return;
      }
      const passwordData = hashPassword(password, user.passwordSalt);
      if (passwordData.hash !== user.passwordHash) {
        sendJson(response, 401, { error: "Sifre hatali." });
        return;
      }
      sendJson(response, 200, { user: publicUser(user), token: createSession(username) });
      return;
    }

    if (request.url === "/api/save" && request.method === "POST") {
      const user = users[username];
      if (!user) {
        sendJson(response, 404, { error: "Kullanici bulunamadi." });
        return;
      }
      if (!isValidSession(username, body.token)) {
        sendJson(response, 401, { error: "Oturum gecersiz." });
        return;
      }
      user.saveData = body.saveData || null;
      user.updatedAt = new Date().toISOString();
      await writeUsers(users);
      sendJson(response, 200, { ok: true });
      return;
    }

    sendJson(response, 404, { error: "API bulunamadi." });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Sunucu hatasi." });
  }
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${host}:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(rootDir, `.${requestedPath}`);

  if (!filePath.startsWith(rootDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
    });
    response.end(file);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

const server = http.createServer(async (request, response) => {
  if (request.url.startsWith("/api/")) {
    await handleApi(request, response);
    return;
  }
  await serveStatic(request, response);
});

ensureDatabase().then(() => {
  server.listen(port, host, () => {
    console.log(`RPG Sonsuz Av: http://${host}:${port}`);
  });
});
