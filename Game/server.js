const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const usersFile = path.join(dataDir, "users.json");
const port = Number(process.env.PORT) || 5173;
const host = "127.0.0.1";
const sessions = new Map();

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function ensureDatabase() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(usersFile);
  } catch {
    await fs.writeFile(usersFile, "{}\n", "utf8");
  }
}

async function readUsers() {
  await ensureDatabase();
  const text = (await fs.readFile(usersFile, "utf8")).replace(/^\uFEFF/, "");
  return text.trim() ? JSON.parse(text) : {};
}

async function writeUsers(users) {
  await ensureDatabase();
  await fs.writeFile(usersFile, `${JSON.stringify(users, null, 2)}\n`, "utf8");
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
    const body = await readRequestJson(request);
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");
    const users = await readUsers();

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
