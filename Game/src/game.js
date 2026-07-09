import { enemies, enemyPosition } from "./data/enemies.js";
import {
  allLootItems,
  allShopItems,
  itemCatalog,
  materialItems,
  salvageMaterialsByTier,
  shopItems,
  tierConfig,
} from "./data/items.js";
import { createAudioEngine } from "./systems/audio.js";
import {
  clamp,
  getEnemyAnimationName as getCombatEnemyAnimationName,
  getEnemyGroundOffset as getCombatEnemyGroundOffset,
  getEnemyPosition as getCombatEnemyPosition,
  getMobileCombatScale as getCombatMobileCombatScale,
  getStageWidth as getCombatStageWidth,
  randomBetween,
} from "./systems/combat.js";
import {
  getDeathXpPenalty as calculateDeathXpPenalty,
  getEnemyGoldReward as calculateEnemyGoldReward,
  getEnemyXpReward as calculateEnemyXpReward,
  getLootLevelModifier as calculateLootLevelModifier,
  getShopRefreshCost as calculateShopRefreshCost,
  getUpgradeCost as calculateUpgradeCost,
  getXpForNextLevel,
} from "./systems/economy.js";
import { createItemHelpers } from "./systems/inventory.js";
import { showToast as pushToast } from "./ui/toast.js";

const {
  getItemIcon,
  getItemRequiredLevel,
  getItemTier,
  getItemTierConfig,
  getItemType,
  getItemEffect,
  getItemDuration,
  getItemQuantity,
} = createItemHelpers(itemCatalog, tierConfig);

const STAGE_TRAVEL_MS = 2600;
const STAGE_CLEAR_MESSAGE_MS = 1900;
const STAGE_CLEAR_HOLD_MS = 950;
const ENEMY_SPAWN_DISTANCE = 2.1;
const HERO_SHOOT_DISTANCE = 0.72;

function getStageEnemyTarget(stageNumber) {
  const safeStage = Math.max(1, Number(stageNumber) || 1);
  return Math.min(8, 3 + Math.floor(Math.sqrt(safeStage - 1) / 2));
}

function createStageState(stageNumber = 1, overrides = {}) {
  const current = Math.max(1, Number(stageNumber) || 1);
  const enemiesRequired = getStageEnemyTarget(current);
  return {
    current,
    enemiesDefeated: clamp(Number(overrides.enemiesDefeated) || 0, 0, enemiesRequired),
    enemiesRequired,
    phase: overrides.phase || "travel",
    phaseUntil: Number(overrides.phaseUntil) || 0,
    pendingStage: Number(overrides.pendingStage) || 0,
    messageTitle: overrides.messageTitle || "",
    messageText: overrides.messageText || "",
    messageUntil: Number(overrides.messageUntil) || 0,
    messageType: overrides.messageType || "info",
  };
}

const state = {
  session: {
    active: false,
    username: "",
    token: "",
    saveTimer: 0,
    saveStatusTimer: 0,
    saveStatusPriorityUntil: 0,
    lastAutoSaveAt: 0,
  },
  gold: 0,
  gems: 0,
  hero: {
    level: 1,
    xp: 0,
    xpToNext: getXpForNextLevel(1),
    health: 120,
    maxHealth: 120,
    damage: 15,
    attackSpeed: 1.15,
    skillPoints: 0,
    stats: {
      vitality: 0,
      power: 0,
      haste: 0,
    },
    talents: {
      criticalDamage: 0,
      healthBonus: 0,
      shopDiscount: 0,
      luck: 0,
    },
  },
  enemy: null,
  wave: 1,
  maxUnlockedLevel: 1,
  roadmapStart: 1,
  stage: createStageState(1),
  inventory: [],
  equipped: {},
  shopStock: [],
  craftingSlots: [null, null, null],
  activePanel: "shop",
  activeEffects: [],
  bestiary: {},
  leaderboard: [],
  leaderboardFetchedAt: 0,
  soundEnabled: true,
  killsSinceLoot: 0,
  lastEnemyName: "",
  lastAttackAt: 0,
  lastEnemyAttackAt: 0,
  heroDownUntil: 0,
  lastFrameAt: 0,
  lastWallClockAt: Date.now(),
  draggingInventoryUid: "",
  panelsDirty: true,
};

let heroShotTimer = 0;

const audioEngine = createAudioEngine(() => state.soundEnabled);

const upgradeConfig = {
  vitality: {
    label: "Can",
    description: "+25 maksimum can",
    baseCost: 45,
    costGrowth: 1.42,
    apply() {
      state.hero.stats.vitality += 1;
      state.hero.maxHealth += 25;
      state.hero.health += 25;
    },
    value() {
      return state.hero.maxHealth;
    },
  },
  power: {
    label: "Hasar",
    description: "+4 ok hasarı",
    baseCost: 55,
    costGrowth: 1.48,
    apply() {
      state.hero.stats.power += 1;
      state.hero.damage += 4;
    },
    value() {
      return Math.round(getHeroDamage());
    },
  },
  haste: {
    label: "Saldırı Hızı",
    description: "+%7 saldırı hızı",
    baseCost: 75,
    costGrowth: 1.55,
    apply() {
      state.hero.stats.haste += 1;
      state.hero.attackSpeed += 0.07;
    },
    value() {
      return `${state.hero.attackSpeed.toFixed(2)}/sn`;
    },
  },
};

const talentConfig = {
  criticalDamage: {
    label: "Kritik Hasar",
    icon: "CR",
    max: 20,
    perPoint: 0.015,
    description: "Kritik vuruş hasarını çok az artırır.",
    format(level) {
      return `+${Math.round(level * this.perPoint * 100)}%`;
    },
  },
  healthBonus: {
    label: "Can Bonusu",
    icon: "HP",
    max: 30,
    perPoint: 5,
    description: "Maksimum cana küçük ve sabit bonus verir.",
    format(level) {
      return `+${level * this.perPoint} can`;
    },
  },
  shopDiscount: {
    label: "Dükkan İndirimi",
    icon: "MK",
    max: 20,
    perPoint: 0.004,
    description: "Dükkan ve stok yenileme fiyatını az düşürür.",
    format(level) {
      return `-${(level * this.perPoint * 100).toFixed(1)}%`;
    },
  },
  luck: {
    label: "Şans",
    icon: "LK",
    max: 25,
    perPoint: 0.006,
    description: "Ganimet düşme ihtimalini hafif artırır.",
    format(level) {
      return `+${(level * this.perPoint * 100).toFixed(1)}%`;
    },
  },
};

// Item katalogları src/data/items.js modülünden gelir.

// Kullanıcı oturumu, kayıt verisi ve eski kayıt uyumluluğu.
function normalizeUsername(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

async function apiRequest(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Sunucu istegi basarisiz.");
  return data;
}

async function apiGet(path) {
  const response = await fetch(path, { headers: { Accept: "application/json" } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Sunucu istegi basarisiz.");
  return data;
}

function createSaveData() {
  return {
    gold: state.gold,
    gems: 0,
    hero: structuredClone(state.hero),
    wave: state.wave,
    maxUnlockedLevel: state.maxUnlockedLevel,
    stage: serializeStageState(),
    inventory: structuredClone(state.inventory),
    equipped: structuredClone(state.equipped),
    shopStock: structuredClone(state.shopStock),
    activeEffects: serializeActiveEffects(),
    bestiary: structuredClone(state.bestiary),
    soundEnabled: state.soundEnabled,
    killsSinceLoot: state.killsSinceLoot,
    lastEnemyName: state.lastEnemyName,
    enemy: state.enemy ? serializeEnemy(state.enemy) : null,
    savedAt: new Date().toISOString(),
  };
}

function serializeStageState() {
  if (state.stage.phase === "clear" && state.stage.pendingStage) {
    const nextStage = Math.max(1, Number(state.stage.pendingStage) || state.stage.current + 1);
    return {
      current: nextStage,
      enemiesDefeated: 0,
      enemiesRequired: getStageEnemyTarget(nextStage),
      phase: "travel",
      pendingStage: 0,
    };
  }

  return {
    current: state.stage.current,
    enemiesDefeated: state.stage.enemiesDefeated,
    enemiesRequired: state.stage.enemiesRequired,
    phase: state.stage.phase,
    pendingStage: state.stage.pendingStage || 0,
  };
}

function serializeEnemy(enemy) {
  return {
    name: enemy.name,
    level: enemy.level,
    maxHealth: enemy.maxHealth,
    health: enemy.health,
    damage: enemy.damage,
    attackSpeed: enemy.attackSpeed,
    distance: enemy.distance,
    moveSpeed: enemy.moveSpeed,
    xp: enemy.xp,
    gold: enemy.gold,
  };
}

function restoreEnemy(savedEnemy) {
  if (!savedEnemy) return null;
  const template = enemies.find((enemy) => enemy.name === savedEnemy.name) || enemies[0];
  return {
    ...template,
    ...savedEnemy,
    spawnedAt: performance.now(),
    attackAnimUntil: 0,
    currentAnim: "",
  };
}

function serializeActiveEffects() {
  const now = Date.now();
  return state.activeEffects
    .map((effect) => ({
      id: effect.id,
      name: effect.name,
      effect: effect.effect,
      remainingMs: Math.max(0, effect.endsAt - now),
    }))
    .filter((effect) => effect.remainingMs > 0);
}

function restoreActiveEffects(savedEffects = []) {
  const now = Date.now();
  return Array.isArray(savedEffects)
    ? savedEffects
        .filter((effect) => effect.remainingMs > 0)
        .map((effect) => ({
          id: effect.id,
          name: effect.name,
          effect: effect.effect || {},
          endsAt: now + effect.remainingMs,
        }))
    : [];
}

function findMaterialTemplate(id) {
  return materialItems.find((item) => item.id === id) || materialItems[1];
}

function createMaterialStack(materialId, quantity) {
  const template = findMaterialTemplate(materialId);
  return {
    ...template,
    uid: crypto.randomUUID(),
    quantity,
    source: "salvage",
  };
}

function addMaterialToInventory(materialId, quantity, source = "salvage") {
  const amount = Math.max(0, Math.floor(Number(quantity) || 0));
  if (amount <= 0) return null;

  const existing = state.inventory.find((item) => item.id === materialId && getItemType(item) === "material");
  if (existing) {
    existing.quantity = getItemQuantity(existing) + amount;
    existing.source = existing.source || source;
    return existing;
  }

  const stack = createMaterialStack(materialId, amount);
  stack.source = source;
  state.inventory.push(stack);
  return stack;
}

function compactMaterialStacks() {
  const materialStacks = new Map();
  const compactedInventory = [];

  state.inventory.forEach((item) => {
    if (getItemType(item) !== "material") {
      compactedInventory.push(item);
      return;
    }

    const existing = materialStacks.get(item.id);
    if (existing) {
      existing.quantity = getItemQuantity(existing) + getItemQuantity(item);
      state.craftingSlots = state.craftingSlots.map((slotUid) => (slotUid === item.uid ? existing.uid : slotUid));
      return;
    }

    item.quantity = getItemQuantity(item);
    materialStacks.set(item.id, item);
    compactedInventory.push(item);
  });

  state.inventory = compactedInventory.filter((item) => getItemType(item) !== "material" || getItemQuantity(item) > 0);
}

function normalizeVisibleText(value) {
  if (typeof value !== "string") return value;
  const cp1252Map = new Map([
    [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
    [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
    [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
    [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
    [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
    [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
    [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
  ]);
  const badPattern = /[\u00c2\u00c3\u00c4\u00c5\u00e2\ufffd]/g;
  const score = (text) => (text.match(badPattern) || []).length;
  const toCp1252Bytes = (text) => {
    const bytes = [];
    for (const char of text) {
      const code = char.codePointAt(0);
      if (code <= 255) bytes.push(code);
      else if (cp1252Map.has(code)) bytes.push(cp1252Map.get(code));
      else return null;
    }
    return Uint8Array.from(bytes);
  };
  let best = value;
  let bestScore = score(best);
  for (let index = 0; index < 4 && bestScore > 0; index += 1) {
    const bytes = toCp1252Bytes(best);
    if (!bytes) break;
    const next = new TextDecoder("utf-8").decode(bytes);
    const nextScore = score(next);
    if (next === best || nextScore > bestScore) break;
    best = next;
    bestScore = nextScore;
  }
  return best;
}
function normalizeSavedItem(item) {
  if (!item || typeof item !== "object") return item;
  const catalogItem = itemCatalog.get(item.id);
  if (catalogItem) {
    return {
      ...item,
      ...catalogItem,
      uid: item.uid,
      stockId: item.stockId,
      quantity: item.quantity,
      source: item.source,
      locked: item.locked,
      cost: item.cost ?? catalogItem.cost,
    };
  }
  return {
    ...item,
    name: normalizeVisibleText(item.name),
  };
}

function migrateSavedGemsToInventory(savedGemCount) {
  if (savedGemCount && !state.inventory.some((item) => getItemType(item) === "material")) {
    addMaterialToInventory("copper-ore", savedGemCount);
  }

  state.inventory = state.inventory.map((item) => (
    item.id === "gem-shard"
      ? { ...createMaterialStack("copper-ore", getItemQuantity(item)), uid: item.uid, source: item.source || "salvage" }
      : normalizeSavedItem(item)
  ));
  compactMaterialStacks();
}

function chooseSalvageMaterial(itemTier) {
  const materialIds = salvageMaterialsByTier[itemTier] || salvageMaterialsByTier[1];
  return materialIds[Math.floor(Math.random() * materialIds.length)];
}

function createStockItem(item) {
  return { ...item, stockId: crypto.randomUUID() };
}

// Dükkan havuzu: sabit itemler + paket itemleri, yüksek tierler için seviye kapısı.
function getShopTemplatePool() {
  const heroLevel = Math.max(1, Number(state.hero.level) || 1);
  return allShopItems
    .filter((item) => getItemType(item) !== "material")
    .filter((item) => {
      const tier = getItemTier(item);
      if (tier >= 7) return heroLevel >= Math.max(400, getItemRequiredLevel(item) - 10);
      if (tier >= 6) return heroLevel >= Math.max(35, getItemRequiredLevel(item) - 10);
      return true;
    });
}

function chooseShopTemplate(excludedIds = new Set()) {
  const pool = getShopTemplatePool().filter((item) => !excludedIds.has(item.id));
  const candidates = pool.length > 0 ? pool : getShopTemplatePool();
  const totalWeight = candidates.reduce((sum, item) => {
    const tierWeight = tierConfig[getItemTier(item)]?.dropWeight || 1;
    return sum + Math.max(1, Math.round(tierWeight / (getItemType(item) === "potion" ? 2.4 : 1)));
  }, 0);
  let roll = Math.random() * totalWeight;

  for (const item of candidates) {
    const tierWeight = tierConfig[getItemTier(item)]?.dropWeight || 1;
    roll -= Math.max(1, Math.round(tierWeight / (getItemType(item) === "potion" ? 2.4 : 1)));
    if (roll <= 0) return item;
  }

  return candidates[0] || shopItems[0];
}

function createInitialShopStock() {
  const stock = [];
  const usedIds = new Set();
  while (stock.length < 12) {
    const template = chooseShopTemplate(usedIds);
    if (!template) break;
    usedIds.add(template.id);
    stock.push(createStockItem(rebalanceShopItem(template)));
  }
  return refreshShopStock(stock);
}

function getMinimumShopCost(item) {
  const tier = getItemTier(item);
  const type = getItemType(item);
  const tierBase = {
    1: 260,
    2: 950,
    3: 3400,
    4: 11000,
    5: 28000,
    6: 95000,
    7: 650000,
  }[tier] || 260;
  const levelPressure = Math.max(0, getItemRequiredLevel(item) - 1) * 145;
  const wavePressure = Math.max(0, state.wave - 1) * 55;
  const potionMultiplier = type === "potion" ? 1.55 : 1;
  return Math.round((tierBase + levelPressure + wavePressure) * potionMultiplier);
}

function rebalanceShopItem(item) {
  return {
    ...item,
    cost: Math.max(Number(item.cost) || 0, getMinimumShopCost(item)),
  };
}

function randomChoice(entries) {
  return entries[Math.floor(Math.random() * entries.length)];
}

function getGeneratedIcon(slot, tier) {
  const icons = {
    weapon: ["assets/items/Item__16.png", "assets/items/Item__17.png", "assets/items/Item__19.png", "assets/items/Item__18.png", "assets/items/Item__23.png", "assets/items2/Item_23.png", "assets/items3/sword27.png"],
    armor: ["assets/items/Item__60.png", "assets/items/Item__24.png", "assets/items/Item__59.png", "assets/items/Item__58.png", "assets/items/Item__58.png", "assets/items2/Item_45.png", "assets/items3/staff37.png"],
    helmet: ["assets/items/Item__55.png", "assets/items/Item__44.png", "assets/items/Item__53.png", "assets/items/Item__53.png", "assets/items/Item__53.png", "assets/items2/Item_38.png", "assets/items3/staff35.png"],
    gloves: ["assets/items/Item__61.png", "assets/items/Item__62.png", "assets/items/Item__52.png", "assets/items/Item__52.png", "assets/items/Item__52.png", "assets/items2/Item_43.png", "assets/items3/staff34.png"],
    ring: ["assets/items/Item__34.png", "assets/items/Item__40.png", "assets/items/Item__42.png", "assets/items/Item__42.png", "assets/items/Item__42.png", "assets/items2/Item_46.png", "assets/items3/staff33.png"],
    boots: ["assets/items/Item__60.png", "assets/items/Item__24.png", "assets/items/Item__59.png", "assets/items/Item__58.png", "assets/items/Item__58.png", "assets/items2/Item_45.png", "assets/items3/staff37.png"],
  };
  return icons[slot]?.[Math.max(0, tier - 1)] || "assets/items/Item__00.png";
}

function getGeneratedRequiredLevel(tier) {
  const levelBase = { 1: 1, 2: 8, 3: 24, 4: 65, 5: 140, 6: 275, 7: 405 };
  return levelBase[tier] || 1;
}

function getGeneratedTierPower(tier) {
  const powerBase = { 1: 10, 2: 24, 3: 52, 4: 105, 5: 215, 6: 420, 7: 820 };
  return powerBase[tier] || 10;
}

function createGeneratedEquipment(tier, source = "shop", previousCost = 80) {
  const slot = randomChoice(Object.keys(slotLabels));
  const statScale = getGeneratedTierPower(tier) + Math.round(state.wave * (tier >= 6 ? 4 : 1.8));
  const generatedRequiredLevel = getGeneratedRequiredLevel(tier);
  const item = {
    id: `${source}-${slot}-${tier}-${crypto.randomUUID()}`,
    name: `${tierConfig[tier].label} ${slotLabels[slot]}`,
    type: "equipment",
    slot,
    tier,
    requiredLevel: generatedRequiredLevel,
    cost: Math.round(previousCost * 2.15 + getMinimumShopCost({ tier, type: "equipment", requiredLevel: generatedRequiredLevel }) + state.wave * 90),
    icon: getGeneratedIcon(slot, tier),
  };

  if (slot === "weapon") {
    item.damage = statScale;
    item.attackSpeed = Number((0.04 + tier * 0.035).toFixed(2));
  } else if (slot === "armor" || slot === "helmet") {
    item.maxHealth = slot === "armor" ? Math.round(statScale * 4.2) : Math.round(statScale * 2.55);
    if (tier >= 4) item.damage = Math.round(statScale * 0.2);
  } else if (slot === "gloves") {
    item.damage = Math.round(statScale * 0.62);
    item.attackSpeed = Number((0.05 + tier * 0.035).toFixed(2));
  } else {
    item.damage = Math.round(statScale * 0.46);
    item.maxHealth = Math.round(statScale * 1.65);
    if (tier >= 5) item.attackSpeed = Number((0.08 + tier * 0.022).toFixed(2));
  }

  return item;
}

function createReplacementShopItem(previousItem) {
  const maxReplacementTier = state.hero.level >= 400 ? 7 : 6;
  const nextTier = Math.min(maxReplacementTier, Math.max(getItemTier(previousItem), getItemTier(previousItem) + (Math.random() > 0.35 ? 1 : 0)));
  const templatePool = getShopTemplatePool().filter((item) => getItemTier(item) >= nextTier && getItemType(item) === getItemType(previousItem));
  const template = templatePool.length > 0 ? randomChoice(templatePool) : null;
  const item = template ? { ...template } : createGeneratedEquipment(nextTier, "shop", previousItem.cost || 100);
  item.requiredLevel = Math.max(getItemRequiredLevel(previousItem) + 1, getItemRequiredLevel(item));
  item.cost = Math.max(
    getMinimumShopCost(item),
    Math.round((previousItem.cost || 100) * 2.35 + nextTier * 750 + state.wave * 120),
  );
  return createStockItem(item);
}

function refreshShopStock(stock) {
  const normalized = stock.map((item) => rebalanceShopItem(normalizeSavedItem(item)));
  const usedIds = new Set(normalized.map((item) => item.id).filter(Boolean));
  while (normalized.length < 12) {
    const template = chooseShopTemplate(usedIds);
    if (!template) break;
    usedIds.add(template.id);
    normalized.push(createStockItem(rebalanceShopItem(template)));
  }

  let packTwoCount = normalized.filter((item) => item.id?.startsWith("pack2-")).length;
  for (let index = normalized.length - 1; index >= 0 && packTwoCount < 4; index -= 1) {
    if (normalized[index].id?.startsWith("pack2-")) continue;
    const template = chooseShopTemplate(usedIds);
    if (!template?.id?.startsWith("pack2-")) {
      const directPackTemplate = allLootItems.find((item) => item.id?.startsWith("pack2-") && !usedIds.has(item.id) && getItemTier(item) < 6);
      if (!directPackTemplate) break;
      usedIds.add(directPackTemplate.id);
      normalized[index] = createStockItem(rebalanceShopItem(directPackTemplate));
    } else {
      usedIds.add(template.id);
      normalized[index] = createStockItem(rebalanceShopItem(template));
    }
    packTwoCount += 1;
  }

  return normalized;
}

function loadSaveData(saveData) {
  if (!saveData) {
    resetCharacterState();
    beginStage(1, {
      title: "Stage 1",
      text: "İlk yolculuk başlıyor.",
    });
    return;
  }

  state.gold = Number(saveData.gold) || 0;
  state.gems = Number(saveData.gems) || 0;
  state.hero = {
    ...state.hero,
    ...(saveData.hero || {}),
    stats: {
      vitality: 0,
      power: 0,
      haste: 0,
      ...(saveData.hero?.stats || {}),
    },
    talents: {
      criticalDamage: 0,
      healthBonus: 0,
      shopDiscount: 0,
      luck: 0,
      ...(saveData.hero?.talents || {}),
    },
  };
  const hasSavedSkillPoints = Object.prototype.hasOwnProperty.call(saveData.hero || {}, "skillPoints");
  state.hero.skillPoints = Math.max(0, Number(saveData.hero?.skillPoints) || 0);
  delete state.hero.statPoints;
  clampTalentLevels();
  state.hero.level = Math.max(1, Number(state.hero.level) || 1);
  if (!hasSavedSkillPoints) {
    const spentTalentPoints = Object.values(state.hero.talents).reduce((sum, level) => sum + (Number(level) || 0), 0);
    state.hero.skillPoints = Math.max(0, state.hero.level - 1 - spentTalentPoints);
  }
  state.hero.xp = Math.max(0, Number(state.hero.xp) || 0);
  state.hero.xpToNext = getXpForNextLevel(state.hero.level);
  const savedStageNumber = Number(saveData.stage?.current || saveData.wave) || 1;
  state.maxUnlockedLevel = Math.max(Number(saveData.maxUnlockedLevel) || 1, savedStageNumber);
  state.stage = createStageState(Math.min(savedStageNumber, state.maxUnlockedLevel), saveData.stage || {});
  state.stage.current = Math.max(1, Math.min(state.stage.current, state.maxUnlockedLevel));
  state.stage.enemiesRequired = getStageEnemyTarget(state.stage.current);
  state.stage.enemiesDefeated = clamp(state.stage.enemiesDefeated, 0, Math.max(0, state.stage.enemiesRequired - 1));
  syncStageAlias();
  state.inventory = Array.isArray(saveData.inventory) ? saveData.inventory : [];
  migrateSavedGemsToInventory(Number(saveData.gems) || 0);
  state.gems = 0;
  state.equipped = Object.fromEntries(Object.entries(saveData.equipped || {}).map(([slot, item]) => [slot, normalizeSavedItem(item)]));
  state.shopStock = Array.isArray(saveData.shopStock) && saveData.shopStock.length > 0
    ? refreshShopStock(saveData.shopStock)
    : createInitialShopStock();
  state.activeEffects = restoreActiveEffects(saveData.activeEffects);
  state.bestiary = saveData.bestiary && typeof saveData.bestiary === "object" ? saveData.bestiary : {};
  state.leaderboard = [];
  state.leaderboardFetchedAt = 0;
  state.soundEnabled = saveData.soundEnabled !== false;
  state.killsSinceLoot = Number(saveData.killsSinceLoot) || 0;
  state.lastEnemyName = saveData.lastEnemyName || "";
  state.enemy = state.stage.phase === "combat" ? restoreEnemy(saveData.enemy) : null;
  if (!state.enemy) {
    beginStageTravel({
      title: `Stage ${state.stage.current}`,
      text: `${state.stage.enemiesDefeated}/${state.stage.enemiesRequired} düşman temizlendi. Yolculuk sürüyor.`,
      durationMs: 1400,
    });
  }
}

function resetCharacterState() {
  state.gold = 0;
  state.gems = 0;
  state.hero = {
    level: 1,
    xp: 0,
    xpToNext: getXpForNextLevel(1),
    health: 120,
    maxHealth: 120,
    damage: 15,
    attackSpeed: 1.15,
    skillPoints: 0,
    stats: {
      vitality: 0,
      power: 0,
      haste: 0,
    },
    talents: {
      criticalDamage: 0,
      healthBonus: 0,
      shopDiscount: 0,
      luck: 0,
    },
  };
  state.enemy = null;
  state.wave = 1;
  state.maxUnlockedLevel = 1;
  state.roadmapStart = 1;
  state.stage = createStageState(1);
  state.inventory = [];
  state.equipped = {};
  state.shopStock = createInitialShopStock();
  state.craftingSlots = [null, null, null];
  state.activePanel = "shop";
  state.activeEffects = [];
  state.bestiary = {};
  state.leaderboard = [];
  state.leaderboardFetchedAt = 0;
  state.soundEnabled = true;
  state.killsSinceLoot = 0;
  state.lastEnemyName = "";
}

const els = {
  authScreen: document.querySelector("#authScreen"),
  stage: document.querySelector(".stage"),
  authForm: document.querySelector("#authForm"),
  usernameInput: document.querySelector("#usernameInput"),
  passwordInput: document.querySelector("#passwordInput"),
  authMessage: document.querySelector("#authMessage"),
  currentUserText: document.querySelector("#currentUserText"),
  saveStatus: document.querySelector("#saveStatus"),
  logoutButton: document.querySelector("#logoutButton"),
  resetButton: document.querySelector("#resetButton"),
  soundToggleButton: document.querySelector("#soundToggleButton"),
  heroLevel: document.querySelector("#heroLevel"),
  healthText: document.querySelector("#healthText"),
  healthBar: document.querySelector("#healthBar"),
  heroWrap: document.querySelector("#heroWrap"),
  enemyName: document.querySelector("#enemyName"),
  enemyLevel: document.querySelector("#enemyLevel"),
  enemyInitial: document.querySelector("#enemyInitial"),
  enemyAvatar: document.querySelector("#enemyAvatar"),
  enemyWrap: document.querySelector(".enemy-wrap"),
  enemyHealthText: document.querySelector("#enemyHealthText"),
  enemyHealthBar: document.querySelector("#enemyHealthBar"),
  roadmapRange: document.querySelector("#roadmapRange"),
  roadmapStatus: document.querySelector("#roadmapStatus"),
  roadmapGrid: document.querySelector("#roadmapGrid"),
  stageBanner: document.querySelector("#stageBanner"),
  stageBannerTitle: document.querySelector("#stageBannerTitle"),
  stageBannerText: document.querySelector("#stageBannerText"),
  xpText: document.querySelector("#xpText"),
  xpBar: document.querySelector("#xpBar"),
  goldText: document.querySelector("#goldText"),
  pointsText: document.querySelector("#pointsText"),
  statsGrid: document.querySelector("#statsGrid"),
  talentPointsText: document.querySelector("#talentPointsText"),
  talentTree: document.querySelector("#talentTree"),
  equippedSummary: document.querySelector("#equippedSummary"),
  enemyList: document.querySelector("#enemyList"),
  leaderboardList: document.querySelector("#leaderboardList"),
  shopList: document.querySelector("#shopList"),
  shopHint: document.querySelector("#shopHint"),
  refreshShopButton: document.querySelector("#refreshShopButton"),
  shopRefreshHint: document.querySelector("#shopRefreshHint"),
  inventoryList: document.querySelector("#inventoryList"),
  inventoryCount: document.querySelector("#inventoryCount"),
  craftingList: document.querySelector("#craftingList"),
  recipeList: document.querySelector("#recipeList"),
  craftHint: document.querySelector("#craftHint"),
  craftButton: document.querySelector("#craftButton"),
  panelTabs: document.querySelectorAll("[data-panel-tab]"),
  panelViews: document.querySelectorAll("[data-panel-view]"),
  statusGrid: document.querySelector("#statusGrid"),
  statusHint: document.querySelector("#statusHint"),
  projectileLane: document.querySelector("#projectileLane"),
  deathOverlay: document.querySelector("#deathOverlay"),
  deathCountdown: document.querySelector("#deathCountdown"),
  comparePanel: document.querySelector("#comparePanel"),
  toastStack: document.querySelector("#toastStack"),
};

const slotLabels = {
  weapon: "Silah",
  armor: "Zırh",
  helmet: "Başlık",
  gloves: "Eldiven",
  ring: "Yüzük",
  boots: "Bot",
};

function getStageWidth() {
  return getCombatStageWidth(els.stage);
}

function getMobileCombatScale() {
  return getCombatMobileCombatScale(getStageWidth());
}

function getEnemyPosition() {
  return getCombatEnemyPosition(getStageWidth(), enemyPosition);
}

function getEnemyAnimationName(now = performance.now()) {
  return getCombatEnemyAnimationName(state, now);
}

function getEnemyGroundOffset(animName = getEnemyAnimationName()) {
  return getCombatEnemyGroundOffset(state, animName);
}

els.enemyAvatar.addEventListener("animationend", (event) => {
  if (event.animationName === "hit") {
    els.enemyAvatar.classList.remove("hit");
  }
  if (event.animationName === "enemy-attack") {
    els.enemyAvatar.classList.remove("attacking");
  }
});

els.authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const action = event.submitter?.dataset.authAction || "login";
  await handleAuth(action);
});

els.logoutButton.addEventListener("click", async () => {
  await flushSave();
  state.session.active = false;
  state.session.username = "";
  state.session.token = "";
  state.lastFrameAt = 0;
  els.authScreen.classList.remove("hidden");
  els.currentUserText.textContent = "Misafir";
  els.saveStatus.textContent = "Giriş bekleniyor";
  showAuthMessage("Giriş yap veya kayıt ol.");
});

els.resetButton.addEventListener("click", () => {
  if (!state.session.active) return;
  if (!confirm("Karakter, envanter, altın ve tüm ilerleme sıfırlansın mı?")) return;
  resetCharacterState();
  beginStage(1, {
    title: "Stage 1",
    text: "Macera baştan başladı.",
  });
  state.panelsDirty = true;
  queueSave("Karakter sıfırlandı");
  render();
});

els.craftButton.addEventListener("click", () => craftItemFromMaterials());
els.refreshShopButton.addEventListener("click", () => refreshShopForGold());
els.soundToggleButton.addEventListener("click", () => toggleSound());

els.panelTabs.forEach((button) => {
  button.addEventListener("click", () => {
    state.activePanel = button.dataset.panelTab;
    renderPanelTabs();
    if (state.activePanel === "leaderboard") refreshLeaderboard(true);
  });
});

window.addEventListener("beforeunload", () => {
  flushSave();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  state.lastFrameAt = performance.now();
  render();
});

async function handleAuth(action) {
  const username = normalizeUsername(els.usernameInput.value);
  const password = els.passwordInput.value;

  if (username.length < 3 || password.length < 4) {
    showAuthMessage("Kullanıcı adı en az 3, şifre en az 4 karakter olmalı.");
    return;
  }

  els.authMessage.textContent = action === "register" ? "Kayıt açılıyor..." : "Giriş yapılıyor...";

  try {
    if (action === "register") {
      await registerUser(username, password);
      return;
    }
    await loginUser(username, password);
  } catch (error) {
    showAuthMessage(error.message || "İşlem tamamlanamadı.");
  }
}

async function registerUser(username, password) {
  const data = await apiRequest("/api/register", { username, password });
  await startSession(data.user, data.token);
  queueSave("Kayıt oluşturuldu");
}

async function loginUser(username, password) {
  const data = await apiRequest("/api/login", { username, password });
  await startSession(data.user, data.token);
}

async function startSession(user, token) {
  state.session.active = true;
  state.session.username = user.username;
  state.session.token = token || "";
  state.session.lastAutoSaveAt = performance.now();
  state.lastAttackAt = 0;
  state.lastEnemyAttackAt = 0;
  state.heroDownUntil = 0;
  state.lastFrameAt = 0;
  state.panelsDirty = true;
  loadSaveData(user.saveData);
  state.hero.health = Math.max(1, Math.min(state.hero.health, getHeroMaxHealth()));
  els.heroWrap.classList.remove("dead");
  els.deathOverlay.hidden = true;
  els.authScreen.classList.add("hidden");
  els.passwordInput.value = "";
  showAuthMessage("");
  els.currentUserText.textContent = user.username;
  setSaveStatus("Karakter yuklendi");
  render();
  renderEnemyFrame();
  refreshLeaderboard(true);
}

function showAuthMessage(message) {
  els.authMessage.textContent = message;
}

function setSaveStatus(message, priorityMs = 0) {
  const now = performance.now();
  if (priorityMs <= 0 && state.session.saveStatusPriorityUntil > now) return;
  state.session.saveStatusPriorityUntil = priorityMs > 0 ? now + priorityMs : 0;
  els.saveStatus.textContent = message;
  clearTimeout(state.session.saveStatusTimer);
  state.session.saveStatusTimer = window.setTimeout(() => {
    if (state.session.active) els.saveStatus.textContent = "Kayıt hazır";
  }, 1600);
}

function queueSave(message = "Kaydediliyor") {
  if (!state.session.active) return;
  setSaveStatus(message);
  clearTimeout(state.session.saveTimer);
  state.session.saveTimer = window.setTimeout(() => {
    flushSave();
  }, 650);
}

function showToast(message, type = "info") {
  pushToast(els.toastStack, message, type);
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  setSaveStatus(state.soundEnabled ? "Ses açıldı" : "Ses kapatıldı");
  queueSave("Ses ayarı kaydediliyor");
  render();
}

function playSound(kind) {
  audioEngine.play(kind);
}

async function flushSave() {
  if (!state.session.active || !state.session.username || !state.session.token) return;
  clearTimeout(state.session.saveTimer);
  try {
    await apiRequest("/api/save", {
      username: state.session.username,
      token: state.session.token,
      saveData: createSaveData(),
    });
    setSaveStatus("Kaydedildi");
    if (state.activePanel === "leaderboard") refreshLeaderboard(true);
  } catch {
    setSaveStatus("Kayıt hatası");
  }
}

async function refreshLeaderboard(force = false) {
  const now = Date.now();
  if (!force && now - state.leaderboardFetchedAt < 10000) return;
  state.leaderboardFetchedAt = now;

  try {
    const data = await apiGet("/api/leaderboard");
    state.leaderboard = Array.isArray(data.leaderboard) ? data.leaderboard : [];
    state.panelsDirty = true;
    renderPanels();
  } catch {
    state.leaderboard = [];
    if (els.leaderboardList) {
      els.leaderboardList.innerHTML = '<div class="leaderboard-empty">Liderlik tablosu yüklenemedi.</div>';
    }
  }
}

function getItemBonus(key) {
  return Object.values(state.equipped).reduce((sum, item) => sum + (item[key] || 0), 0);
}

function getEffectBonus(key) {
  return state.activeEffects.reduce((sum, activeEffect) => sum + (activeEffect.effect?.[key] || 0), 0);
}

function clampTalentLevels() {
  state.hero.talents = state.hero.talents || {};
  Object.entries(talentConfig).forEach(([key, talent]) => {
    state.hero.talents[key] = clamp(Math.round(Number(state.hero.talents[key]) || 0), 0, talent.max);
  });
}

function getTalentLevel(key) {
  return clamp(Math.round(Number(state.hero.talents?.[key]) || 0), 0, talentConfig[key]?.max || 0);
}

function getTalentBonus(key) {
  const talent = talentConfig[key];
  return talent ? getTalentLevel(key) * talent.perPoint : 0;
}

function getCriticalDamageMultiplier() {
  return 1 + getTalentBonus("criticalDamage");
}

function getShopDiscountRate() {
  return Math.min(0.08, getTalentBonus("shopDiscount"));
}

function getLuckDropBonus() {
  return Math.min(0.15, getTalentBonus("luck"));
}

function getDiscountedShopCost(cost) {
  return Math.max(1, Math.round((Number(cost) || 0) * (1 - getShopDiscountRate())));
}

function getShopItemPrice(item) {
  return getDiscountedShopCost(item.cost);
}

function getHeroDamage() {
  return state.hero.damage + getItemBonus("damage") + getEffectBonus("damage");
}

function getHeroMaxHealth() {
  return state.hero.maxHealth + getTalentBonus("healthBonus") + getItemBonus("maxHealth") + getEffectBonus("maxHealth");
}

function getHeroAttackSpeed() {
  return state.hero.attackSpeed + getItemBonus("attackSpeed") + getEffectBonus("attackSpeed");
}

function getUpgradeCost(upgradeKey) {
  const upgrade = upgradeConfig[upgradeKey];
  return calculateUpgradeCost(upgrade, state.hero.stats[upgradeKey] || 0);
}

function canEquipItem(item) {
  return state.hero.level >= getItemRequiredLevel(item);
}

function applyTierStyle(element, item) {
  const tier = getItemTierConfig(item);
  const tierLevel = getItemTier(item);
  element.style.setProperty("--tier-color", tier.color);
  element.dataset.tier = tierLevel;
  element.classList.remove("tier-1", "tier-2", "tier-3", "tier-4", "tier-5", "tier-6", "tier-7");
  element.classList.add(`tier-${tierLevel}`);
}

function chooseLootTier(enemyLevel) {
  const maxTier = enemyLevel >= 400 ? 7
    : enemyLevel >= 275 ? 6
      : enemyLevel >= 140 ? 5
        : enemyLevel >= 65 ? 4
          : enemyLevel >= 24 ? 3
            : enemyLevel >= 8 ? 2
              : 1;
  const entries = Object.entries(tierConfig).filter(([tier]) => Number(tier) <= maxTier);
  const totalWeight = entries.reduce((sum, [, tier]) => sum + tier.dropWeight, 0);
  let roll = Math.random() * totalWeight;

  for (const [tier, config] of entries) {
    roll -= config.dropWeight;
    if (roll <= 0) return Number(tier);
  }

  return 1;
}

function removeInventoryItem(uid) {
  const item = state.inventory.find((entry) => entry.uid === uid);
  if (!item) return null;
  if (state.equipped[item.slot]?.uid === uid) delete state.equipped[item.slot];
  state.craftingSlots = state.craftingSlots.map((slotUid) => (slotUid === uid ? null : slotUid));
  state.inventory = state.inventory.filter((entry) => entry.uid !== uid);
  state.hero.health = Math.min(state.hero.health, getHeroMaxHealth());
  return item;
}

function syncStageAlias() {
  state.wave = Math.max(1, Number(state.stage.current) || 1);
  state.roadmapStart = getRoadmapBlockStart(state.wave);
}

function setStageBanner(title, text = "", type = "info", durationMs = STAGE_CLEAR_MESSAGE_MS) {
  const now = performance.now();
  state.stage.messageTitle = title;
  state.stage.messageText = text;
  state.stage.messageType = type;
  state.stage.messageUntil = title ? now + durationMs : 0;
}

function beginStageTravel({ title = "", text = "", type = "info", durationMs = STAGE_TRAVEL_MS } = {}) {
  state.stage.phase = "travel";
  state.stage.phaseUntil = performance.now() + durationMs;
  state.stage.pendingStage = 0;
  state.enemy = null;
  state.lastAttackAt = 0;
  state.lastEnemyAttackAt = 0;
  if (title) setStageBanner(title, text, type, Math.max(durationMs - 250, 900));
  state.panelsDirty = true;
}

function beginStage(stageNumber, options = {}) {
  const current = Math.max(1, Math.round(stageNumber));
  state.stage = createStageState(current);
  syncStageAlias();
  beginStageTravel({
    title: options.title || `Stage ${current}`,
    text: options.text || "Yolculuk başlıyor.",
    type: options.type || "info",
  });
}

function beginStageCombat(forcedTemplate = null) {
  state.stage.phase = "combat";
  state.stage.phaseUntil = 0;
  state.stage.pendingStage = 0;
  state.stage.messageTitle = "";
  state.stage.messageText = "";
  state.stage.messageUntil = 0;
  spawnEnemy(forcedTemplate);
  state.panelsDirty = true;
}

function restartCurrentStage() {
  beginStage(state.stage.current, {
    title: "Stage Yeniden Başladı",
    text: `Stage ${state.stage.current} baştan oynanıyor.`,
    type: "fail",
  });
}

function recoverAfterStageClear() {
  const maxHealth = getHeroMaxHealth();
  const before = state.hero.health;
  const recovery = Math.max(18, Math.round(maxHealth * 0.18));
  state.hero.health = Math.min(maxHealth, state.hero.health + recovery);
  return Math.round(state.hero.health - before);
}

function completeCurrentStage() {
  const completedStage = state.stage.current;
  const nextStage = completedStage + 1;
  const recoveredHealth = recoverAfterStageClear();
  state.maxUnlockedLevel = Math.max(state.maxUnlockedLevel, nextStage);
  state.stage.phase = "clear";
  state.stage.phaseUntil = performance.now() + STAGE_CLEAR_HOLD_MS;
  state.stage.pendingStage = nextStage;
  state.enemy = null;
  state.lastAttackAt = 0;
  state.lastEnemyAttackAt = 0;
  setStageBanner(
    "Stage Geçildi",
    `Stage ${completedStage} tamamlandı. Sıradaki hedef Stage ${nextStage}.${recoveredHealth > 0 ? ` Kısa mola: +${recoveredHealth} can.` : ""}`,
    "success",
    STAGE_CLEAR_HOLD_MS + STAGE_TRAVEL_MS - 150,
  );
  state.panelsDirty = true;
  showToast(`Stage ${completedStage} geçildi`, "level");
  playSound("level");
}

function finishStageClearTransition() {
  const nextStage = Math.max(1, Number(state.stage.pendingStage) || state.stage.current + 1);
  state.stage = createStageState(nextStage);
  syncStageAlias();
  beginStageTravel({
    title: `Stage ${nextStage}`,
    text: "Yeni bölgeye ilerleniyor.",
    type: "info",
  });
}

function updateStagePhase(now) {
  if (state.stage.messageUntil > 0 && now >= state.stage.messageUntil) {
    state.stage.messageTitle = "";
    state.stage.messageText = "";
    state.stage.messageUntil = 0;
  }

  if (state.heroDownUntil > 0) return;
  if (state.stage.phase === "clear" && now >= state.stage.phaseUntil) {
    finishStageClearTransition();
    return;
  }

  if (state.stage.phase === "travel" && now >= state.stage.phaseUntil) {
    beginStageCombat();
  }
}

function getCurrentEnemyLevel() {
  const stageNumber = Math.max(1, Number(state.stage.current) || state.wave || 1);
  const stagePressure = Math.floor((stageNumber - 1) / 12);
  const enemyPressure = Math.floor((Number(state.stage.enemiesDefeated) || 0) / 3);
  return Math.max(1, stageNumber + stagePressure + enemyPressure);
}

function getEnemyStatProfile(enemyLevel) {
  const stageNumber = Math.max(1, Number(state.stage.current) || 1);
  const defeatedInStage = Math.max(0, Number(state.stage.enemiesDefeated) || 0);
  const isStageFinalEnemy = defeatedInStage >= getStageEnemyTarget(stageNumber) - 1;
  const stageModifier = 1 + Math.min((stageNumber - 1) * 0.003, 0.34);
  const finalEnemyModifier = isStageFinalEnemy ? 1.12 : 1;

  return {
    maxHealth: Math.round((44 + enemyLevel * 13 + Math.pow(enemyLevel, 1.12) * 4.8) * stageModifier * finalEnemyModifier),
    damage: Math.round((3 + enemyLevel * 1.34 + Math.pow(enemyLevel, 1.03) * 0.28) * (isStageFinalEnemy ? 1.08 : 1)),
    attackSpeed: Math.min(0.88 + Math.sqrt(enemyLevel) * 0.045 + enemyLevel * 0.0024, 1.62),
    moveSpeed: Math.min(0.4 + Math.sqrt(enemyLevel) * 0.012, 0.64),
    gold: Math.round(12 + enemyLevel * 5 + stageNumber * 1.5),
  };
}

function spawnEnemy(forcedTemplate = null) {
  const options = enemies.length > 1 ? enemies.filter((enemy) => enemy.name !== state.lastEnemyName) : enemies;
  const template = forcedTemplate || options[Math.floor(Math.random() * options.length)];
  const level = getCurrentEnemyLevel();
  const profile = getEnemyStatProfile(level);

  state.enemy = {
    ...template,
    level,
    maxHealth: profile.maxHealth,
    health: profile.maxHealth,
    damage: profile.damage,
    attackSpeed: profile.attackSpeed,
    distance: ENEMY_SPAWN_DISTANCE,
    moveSpeed: profile.moveSpeed,
    xp: getEnemyXpReward(level),
    gold: profile.gold,
    spawnedAt: performance.now(),
    attackAnimUntil: 0,
    currentAnim: "",
  };
  state.lastEnemyName = template.name;
  state.lastEnemyAttackAt = 0;
}

function getRoadmapBlockStart(level) {
  const safeLevel = Math.max(1, Math.round(level));
  return safeLevel <= 50 ? 1 : Math.floor((safeLevel - 1) / 50) * 50;
}

function getEnemyXpReward(enemyLevel) {
  return calculateEnemyXpReward(enemyLevel, state.hero.level);
}

function setRoadmapBlock(start) {
  const safeStart = Math.max(1, Math.round(start));
  state.roadmapStart = safeStart <= 1 ? 1 : Math.floor(safeStart / 50) * 50;
  renderRoadmap();
}

function selectStageLevel(level) {
  const selectedLevel = Math.max(1, Math.round(level));
  if (selectedLevel > state.maxUnlockedLevel) {
    setSaveStatus(`Stage ${selectedLevel} henüz açılmadı`, 1600);
    return;
  }

  beginStage(selectedLevel, {
    title: `Stage ${selectedLevel}`,
    text: "Bu stage baştan başlıyor.",
  });
  state.panelsDirty = true;
  setSaveStatus(`Stage ${state.stage.current} seçildi`);
  queueSave("Stage seçildi");
  render();
}

function testEnemy(enemyName) {
  const template = enemies.find((enemy) => enemy.name === enemyName);
  if (!template) return;

  state.stage.phase = "combat";
  spawnEnemy(template);
  state.enemy.distance = 0;
  state.enemy.health = state.enemy.maxHealth;
  state.enemy.activeAttackAnim = state.enemy.animations.attackAlt && Math.random() > 0.5 ? "attackAlt" : "attack";
  state.enemy.attackAnimUntil = performance.now() + Math.max(700, state.enemy.animations[state.enemy.activeAttackAnim].frames * state.enemy.animations[state.enemy.activeAttackAnim].frameMs);
  state.enemy.currentAnim = "";
  state.lastEnemyAttackAt = performance.now();
  setSaveStatus(`${enemyName} test ediliyor`);
  render();
  renderEnemyFrame();
}

function approachEnemy(deltaSeconds) {
  if (state.stage.phase !== "combat" || state.heroDownUntil > 0 || !state.enemy || state.enemy.distance <= 0) return;
  state.enemy.distance = Math.max(0, state.enemy.distance - state.enemy.moveSpeed * deltaSeconds);
}

function attackEnemy(now) {
  if (state.stage.phase !== "combat" || state.heroDownUntil > now || !state.enemy) return;
  if (state.enemy.distance > HERO_SHOOT_DISTANCE) return;

  const interval = 1000 / getHeroAttackSpeed();
  if (now - state.lastAttackAt < interval) return;

  state.lastAttackAt = now;
  const isCritical = Math.random() < 0.12;
  const criticalMultiplier = isCritical ? randomBetween(1.55, 1.9) * getCriticalDamageMultiplier() : 1;
  const damage = Math.round(getHeroDamage() * randomBetween(0.9, 1.15) * criticalMultiplier);
  state.enemy.health = Math.max(0, state.enemy.health - damage);
  fireArrow();
  flashEnemy();
  showDamageNumber(damage, isCritical);
  playSound("hit");
  queueSave("Savaş kaydediliyor");

  if (state.enemy.health <= 0) {
    defeatEnemy();
  }
}

function enemyAttackHero(now) {
  if (state.stage.phase !== "combat" || state.heroDownUntil > now || !state.enemy || state.enemy.distance > 0) return;

  const interval = 1000 / state.enemy.attackSpeed;
  if (now - state.lastEnemyAttackAt < interval) return;

  state.lastEnemyAttackAt = now;
  state.hero.health = Math.max(0, state.hero.health - Math.round(state.enemy.damage * randomBetween(0.85, 1.2)));
  flashHero();
  playSound("hit");
  lungeEnemy(now);
  queueSave("Savaş kaydediliyor");

  if (state.hero.health <= 0) {
    downHero(now);
  }
}

function defeatEnemy() {
  const defeated = state.enemy;
  const earnedXp = getEnemyXpReward(defeated.level);
  const earnedGold = getEnemyGoldReward(defeated);
  state.gold += earnedGold;
  state.hero.xp += earnedXp;
  state.killsSinceLoot += 1;
  const droppedItem = rollLoot(defeated.level);
  recordBestiaryKill(defeated, droppedItem);
  state.stage.enemiesDefeated = Math.min(state.stage.enemiesRequired, state.stage.enemiesDefeated + 1);
  levelUpIfNeeded();
  state.panelsDirty = true;

  if (state.stage.enemiesDefeated >= state.stage.enemiesRequired) {
    completeCurrentStage();
  } else {
    spawnEnemy();
    setStageBanner(
      `Stage ${state.stage.current}`,
      `${state.stage.enemiesDefeated}/${state.stage.enemiesRequired} düşman temizlendi.`,
      "info",
      1100,
    );
  }

  queueSave("İlerleme kaydediliyor");
}

function getBestiaryEntry(enemyName) {
  if (!state.bestiary[enemyName]) {
    state.bestiary[enemyName] = {
      kills: 0,
      drops: 0,
      highestLevel: 0,
      lastDrop: "",
    };
  }
  return state.bestiary[enemyName];
}

function recordBestiaryKill(enemy, droppedItem = null) {
  const entry = getBestiaryEntry(enemy.name);
  entry.kills += 1;
  entry.highestLevel = Math.max(entry.highestLevel || 0, enemy.level || 1);
  if (droppedItem) {
    entry.drops += 1;
    entry.lastDrop = droppedItem.name;
  }
}

// Düşük level farmını azaltan ekonomi ayarları: XP, altın, item düşüşü ve ölüm cezası.
function getEnemyGoldReward(enemy) {
  return calculateEnemyGoldReward(enemy, state.hero.level);
}

function getLootLevelModifier(enemyLevel) {
  return calculateLootLevelModifier(enemyLevel, state.hero.level);
}

function rollLoot(enemyLevel) {
  const levelModifier = getLootLevelModifier(enemyLevel);
  const luckMultiplier = 1 + getLuckDropBonus();
  const dropChance = Math.min(0.035 + enemyLevel * 0.0015, 0.1) * levelModifier * luckMultiplier;
  const pityThreshold = Math.round(18 / Math.max(0.2, levelModifier * luckMultiplier));
  const pityDrop = state.killsSinceLoot >= pityThreshold;
  if (!pityDrop && Math.random() > dropChance) return null;

  const selectedTier = chooseLootTier(enemyLevel);
  const tierPool = allLootItems.filter((item) => getItemTier(item) === selectedTier);
  const pool = tierPool.length > 0 ? tierPool : allLootItems;
  const template = pool[Math.floor(Math.random() * pool.length)];
  state.inventory.push({
    ...template,
    uid: crypto.randomUUID(),
    source: "drop",
  });
  state.killsSinceLoot = 0;
  state.panelsDirty = true;
  showToast(`${template.name} düştü`, `tier-${getItemTier(template)}`);
  playSound("loot");
  queueSave("Ganimet kaydediliyor");
  return template;
}

function getDeathXpPenalty() {
  return calculateDeathXpPenalty(state.hero.level, state.stage.current);
}

function downHero(now) {
  const xpPenalty = Math.min(state.hero.xp, getDeathXpPenalty());
  state.hero.xp = Math.max(0, state.hero.xp - xpPenalty);
  state.heroDownUntil = now + 3000;
  state.hero.health = 0;
  els.heroWrap.classList.add("dead");
  els.deathOverlay.hidden = false;
  setSaveStatus(`Ölüm cezası: -${xpPenalty} XP`, 1600);
  queueSave("Ölüm kaydediliyor");
}

function updateDeath(now) {
  if (state.heroDownUntil <= 0) return;

  const remaining = Math.max(0, Math.ceil((state.heroDownUntil - now) / 1000));
  els.deathCountdown.textContent = remaining;

  if (now < state.heroDownUntil) return;

  state.heroDownUntil = 0;
  state.hero.health = getHeroMaxHealth();
  state.lastAttackAt = 0;
  state.lastEnemyAttackAt = 0;
  els.heroWrap.classList.remove("dead");
  els.deathOverlay.hidden = true;
  restartCurrentStage();
  queueSave("Diriliş kaydediliyor");
}

function levelUpIfNeeded() {
  const previousLevel = state.hero.level;
  state.hero.xpToNext = getXpForNextLevel(state.hero.level);
  while (state.hero.xp >= state.hero.xpToNext) {
    state.hero.xp -= state.hero.xpToNext;
    state.hero.level += 1;
    state.hero.xpToNext = getXpForNextLevel(state.hero.level);
    state.panelsDirty = true;
  }

  if (state.hero.level > previousLevel) {
    const gainedLevels = state.hero.level - previousLevel;
    state.hero.skillPoints = Math.max(0, Number(state.hero.skillPoints) || 0) + gainedLevels;
    state.lastAttackAt = 0;
    state.lastEnemyAttackAt = 0;
    setSaveStatus(`Level ${state.hero.level} açıldı: +${gainedLevels} yetenek puanı`, 1800);
    showToast(`Level ${state.hero.level} açıldı: +${gainedLevels} yetenek puanı`, "level");
    playSound("level");
  }
}

function buyUpgrade(upgradeKey) {
  const upgrade = upgradeConfig[upgradeKey];
  const cost = getUpgradeCost(upgradeKey);
  if (!upgrade || state.gold < cost) return;

  state.gold -= cost;
  upgrade.apply();
  state.panelsDirty = true;
  queueSave("Geliştirme kaydediliyor");
  render();
}

function buyTalent(talentKey) {
  const talent = talentConfig[talentKey];
  if (!talent || state.hero.skillPoints <= 0) return;

  const currentLevel = getTalentLevel(talentKey);
  if (currentLevel >= talent.max) return;

  state.hero.skillPoints -= 1;
  state.hero.talents[talentKey] = currentLevel + 1;
  if (talentKey === "healthBonus") {
    state.hero.health = Math.min(getHeroMaxHealth(), state.hero.health + talent.perPoint);
  }
  state.panelsDirty = true;
  setSaveStatus(`${talent.label} geliştirildi`);
  queueSave("Yetenek kaydediliyor");
  render();
}

function buyItem(stockId) {
  const stockIndex = state.shopStock.findIndex((entry) => entry.stockId === stockId);
  const item = state.shopStock[stockIndex];
  const price = item ? getShopItemPrice(item) : 0;
  if (!item || state.gold < price) return;

  state.gold -= price;
  const { stockId: _stockId, ...inventoryItem } = item;
  state.inventory.push({ ...inventoryItem, uid: crypto.randomUUID(), source: "shop" });
  state.shopStock[stockIndex] = createReplacementShopItem(item);
  state.panelsDirty = true;
  queueSave("Alisveris kaydediliyor");
  render();
}

function getShopRefreshCost() {
  return getDiscountedShopCost(calculateShopRefreshCost(state.hero.level, state.wave));
}

function refreshShopForGold() {
  const cost = getShopRefreshCost();
  if (state.gold < cost) {
    setSaveStatus(`${cost} altın gerekli`);
    return;
  }

  state.gold -= cost;
  state.shopStock = createInitialShopStock();
  state.panelsDirty = true;
  setSaveStatus(`Dükkan yenilendi: -${cost} altın`);
  showToast(`Dükkan yenilendi: -${cost} altın`, "shop");
  queueSave("Dükkan yenilendi");
  render();
}

function usePotion(uid) {
  const item = state.inventory.find((entry) => entry.uid === uid);
  if (!item || getItemType(item) !== "potion") return;
  if (!canEquipItem(item)) {
    setSaveStatus(`Seviye ${getItemRequiredLevel(item)} gerekli`);
    return;
  }

  const removedItem = removeInventoryItem(uid);
  if (!removedItem) return;

  state.activeEffects = state.activeEffects.filter((effect) => effect.id !== removedItem.id);
  state.activeEffects.push({
    id: removedItem.id,
    name: removedItem.name,
    effect: getItemEffect(removedItem),
    endsAt: Date.now() + getItemDuration(removedItem),
  });
  state.hero.health = Math.min(getHeroMaxHealth(), state.hero.health + (getItemEffect(removedItem).maxHealth || 0));
  state.panelsDirty = true;
  queueSave("İksir içildi");
  render();
}

function equipItem(uid) {
  const item = state.inventory.find((entry) => entry.uid === uid);
  if (!item) return;
  if (getItemType(item) !== "equipment") return;
  if (!canEquipItem(item)) {
    setSaveStatus(`Seviye ${getItemRequiredLevel(item)} gerekli`);
    return;
  }

  state.equipped[item.slot] = item;
  state.hero.health = Math.min(state.hero.health, getHeroMaxHealth());
  state.panelsDirty = true;
  queueSave("Ekipman kaydediliyor");
  render();
}

function salvageItem(uid) {
  const target = state.inventory.find((entry) => entry.uid === uid);
  if (isItemLocked(target)) {
    setSaveStatus("Kilitli item parçalanamaz");
    return;
  }
  const item = removeInventoryItem(uid);
  if (!item) return;
  const gainedMaterialCount = 1;
  const materialId = chooseSalvageMaterial(getItemTier(item));
  const material = findMaterialTemplate(materialId);
  addMaterialToInventory(materialId, gainedMaterialCount);
  state.panelsDirty = true;
  setSaveStatus(`${material.name} x${gainedMaterialCount} envantere eklendi`);
  queueSave("Item parcalandi");
  render();
}

function destroyItem(uid) {
  const target = state.inventory.find((entry) => entry.uid === uid);
  if (isItemLocked(target)) {
    setSaveStatus("Kilitli item yok edilemez");
    return;
  }
  const item = removeInventoryItem(uid);
  if (!item) return;
  state.panelsDirty = true;
  setSaveStatus("Item yok edildi");
  queueSave("Item yok edildi");
  render();
}

function isItemLocked(item) {
  return Boolean(item?.locked);
}

function toggleItemLock(uid) {
  const item = state.inventory.find((entry) => entry.uid === uid);
  if (!item) return;
  item.locked = !item.locked;
  state.panelsDirty = true;
  setSaveStatus(item.locked ? "Item kilitlendi" : "Item kilidi açıldı");
  queueSave("Item kilidi kaydediliyor");
  render();
}

function swapInventoryItems(sourceUid, targetUid) {
  if (!sourceUid || !targetUid || sourceUid === targetUid) return;
  const sourceIndex = state.inventory.findIndex((item) => item.uid === sourceUid);
  const targetIndex = state.inventory.findIndex((item) => item.uid === targetUid);
  if (sourceIndex < 0 || targetIndex < 0) return;

  [state.inventory[sourceIndex], state.inventory[targetIndex]] = [state.inventory[targetIndex], state.inventory[sourceIndex]];
  state.panelsDirty = true;
  queueSave("Envanter sırası kaydediliyor");
  render();
}

function getComparableStat(item, key) {
  const catalogItem = itemCatalog.get(item.id);
  return Number(catalogItem?.[key] ?? item[key] ?? 0);
}

function formatStatDelta(value, suffix = "") {
  if (value === 0) return `<span>0${suffix}</span>`;
  const sign = value > 0 ? "+" : "";
  const className = value > 0 ? "positive" : "negative";
  return `<span class="${className}">${sign}${value}${suffix}</span>`;
}

function getItemComparisonHtml(item) {
  const type = getItemType(item);
  const tier = getItemTierConfig(item);
  const title = `<strong>${item.name}</strong><small>T${getItemTier(item)} ${tier.label} - Lv ${getItemRequiredLevel(item)}</small>`;

  if (type === "material") {
    return `${title}<div class="compare-row"><span>Tür</span><b>Malzeme</b></div>`;
  }

  if (type === "potion") {
    const effect = getItemEffect(item);
    const rows = [
      ["Hasar", effect.damage || 0],
      ["Can", effect.maxHealth || 0],
      ["Hız", effect.attackSpeed ? Math.round(effect.attackSpeed * 100) : 0, "%"],
    ].filter(([, value]) => value);
    return `${title}${rows.map(([label, value, suffix = ""]) => `
      <div class="compare-row"><span>${label}</span><b>${formatStatDelta(value, suffix)}</b></div>
    `).join("") || '<div class="compare-row"><span>Etki</span><b>Yok</b></div>'}`;
  }

  const equipped = state.equipped[item.slot];
  const rows = [
    ["Hasar", "damage", ""],
    ["Can", "maxHealth", ""],
    ["Hız", "attackSpeed", "%"],
  ].map(([label, key, suffix]) => {
    const value = key === "attackSpeed" ? Math.round(getComparableStat(item, key) * 100) : getComparableStat(item, key);
    const current = equipped
      ? (key === "attackSpeed" ? Math.round(getComparableStat(equipped, key) * 100) : getComparableStat(equipped, key))
      : 0;
    return [label, value, value - current, suffix];
  });

  return `${title}<em>${equipped ? `${equipped.name} ile karşılaştırılıyor` : `${slotLabels[item.slot]} slotu boş`}</em>${rows.map(([label, value, delta, suffix]) => `
    <div class="compare-row">
      <span>${label}: ${value}${suffix}</span>
      <b>${formatStatDelta(delta, suffix)}</b>
    </div>
  `).join("")}`;
}

function positionComparePanel(event) {
  const panel = els.comparePanel;
  const offset = 14;
  const rect = panel.getBoundingClientRect();
  const targetRect = event.currentTarget?.getBoundingClientRect?.();
  const clientX = Number.isFinite(event.clientX) ? event.clientX : (targetRect?.right || 20);
  const clientY = Number.isFinite(event.clientY) ? event.clientY : (targetRect?.top || 20);
  const left = Math.min(window.innerWidth - rect.width - 10, clientX + offset);
  const top = Math.min(window.innerHeight - rect.height - 10, clientY + offset);
  panel.style.left = `${Math.max(10, left)}px`;
  panel.style.top = `${Math.max(10, top)}px`;
}

function showComparePanel(item, event) {
  els.comparePanel.style.setProperty("--tier-color", getItemTierConfig(item).color);
  els.comparePanel.dataset.tier = getItemTier(item);
  els.comparePanel.innerHTML = getItemComparisonHtml(item);
  els.comparePanel.hidden = false;
  positionComparePanel(event);
}

function hideComparePanel() {
  els.comparePanel.hidden = true;
}

function bindItemPreview(row, item) {
  row.tabIndex = 0;
  row.addEventListener("mouseenter", (event) => showComparePanel(item, event));
  row.addEventListener("mousemove", (event) => positionComparePanel(event));
  row.addEventListener("mouseleave", hideComparePanel);
  row.addEventListener("focusin", (event) => showComparePanel(item, event));
  row.addEventListener("focusout", hideComparePanel);
}

function getMaterialPieces() {
  return state.inventory
    .filter((item) => getItemType(item) === "material")
    .reduce((pieces, item) => {
      const quantity = getItemQuantity(item);
      for (let index = 0; index < quantity; index += 1) {
        pieces.push({ uid: item.uid, tier: getItemTier(item), name: item.name });
      }
      return pieces;
    }, [])
    .sort((a, b) => b.tier - a.tier);
}

function getCraftSlotCounts() {
  return state.craftingSlots.reduce((counts, uid) => {
    if (!uid) return counts;
    counts[uid] = (counts[uid] || 0) + 1;
    return counts;
  }, {});
}

function getCraftSlotItems() {
  const counts = {};
  return state.craftingSlots.map((uid) => {
    if (!uid) return null;
    const item = state.inventory.find((entry) => entry.uid === uid && getItemType(entry) === "material");
    if (!item) return null;
    counts[uid] = (counts[uid] || 0) + 1;
    return counts[uid] <= getItemQuantity(item) ? item : null;
  });
}

function assignCraftSlot(slotIndex, uid) {
  const item = state.inventory.find((entry) => entry.uid === uid && getItemType(entry) === "material");
  if (!item) {
    setSaveStatus("Sadece parça eklenebilir");
    return;
  }
  if (isItemLocked(item)) {
    setSaveStatus("Kilitli parça kullanılamaz");
    return;
  }

  const counts = getCraftSlotCounts();
  const replacingUid = state.craftingSlots[slotIndex];
  if (replacingUid) counts[replacingUid] = Math.max(0, (counts[replacingUid] || 1) - 1);
  if ((counts[uid] || 0) >= getItemQuantity(item)) {
    setSaveStatus("Bu parçadan yeterli yok");
    return;
  }

  state.craftingSlots[slotIndex] = uid;
  state.panelsDirty = true;
  render();
}

function addMaterialToNextCraftSlot(uid) {
  const emptyIndex = state.craftingSlots.findIndex((slotUid) => !slotUid);
  if (emptyIndex < 0) {
    setSaveStatus("Birleştirme slotları dolu");
    return;
  }
  assignCraftSlot(emptyIndex, uid);
  state.activePanel = "craft";
  renderPanelTabs();
}

function clearCraftSlot(slotIndex) {
  state.craftingSlots[slotIndex] = null;
  state.panelsDirty = true;
  render();
}

function consumeCraftSlots() {
  const slotItems = getCraftSlotItems();
  const consumedTiers = [];
  const consumedCounts = new Map();
  slotItems.forEach((item) => {
    if (!item) return;
    consumedCounts.set(item.uid, (consumedCounts.get(item.uid) || 0) + 1);
    consumedTiers.push(getItemTier(item));
  });

  state.inventory = state.inventory
    .map((item) => {
      const consumed = consumedCounts.get(item.uid) || 0;
      if (!consumed || getItemType(item) !== "material") return item;
      return { ...item, quantity: getItemQuantity(item) - consumed };
    })
    .filter((item) => getItemType(item) !== "material" || getItemQuantity(item) > 0);

  state.craftingSlots = [null, null, null];
  return consumedTiers;
}

function chooseCraftTier(slotItems) {
  const averageTier = slotItems.reduce((sum, item) => sum + getItemTier(item), 0) / slotItems.length;
  const drift = Math.random() > 0.78 ? 1 : Math.random() < 0.18 ? -1 : 0;
  return clamp(Math.round(averageTier) + drift, 1, 7);
}

function createRandomCraftedItem(slotItems) {
  const targetTier = chooseCraftTier(slotItems);
  const exactPool = allLootItems.filter((item) => getItemType(item) !== "material" && getItemTier(item) === targetTier);
  const fallbackPool = allLootItems.filter((item) => getItemType(item) !== "material" && getItemTier(item) <= targetTier);
  const pool = exactPool.length > 0 ? exactPool : fallbackPool;
  const template = pool[Math.floor(Math.random() * pool.length)] || allLootItems[0];
  return { ...template, cost: 0 };
}

function craftItemFromMaterials() {
  const slotItems = getCraftSlotItems();
  if (slotItems.some((item) => !item)) {
    setSaveStatus("3 slota parça sürükle");
    return;
  }
  if (slotItems.some((item) => isItemLocked(item))) {
    setSaveStatus("Kilitli parça kullanılamaz");
    return;
  }

  consumeCraftSlots();
  const item = createRandomCraftedItem(slotItems);
  state.inventory.push({ ...item, uid: crypto.randomUUID(), source: "crafted" });
  state.panelsDirty = true;
  setSaveStatus(`${item.name} oluşturuldu`);
  showToast(`${item.name} oluşturuldu`, `tier-${getItemTier(item)}`);
  playSound("loot");
  queueSave("Item birleştirildi");
  render();
}

function updateActiveEffects() {
  const before = state.activeEffects.length;
  state.activeEffects = state.activeEffects.filter((effect) => effect.endsAt > Date.now());
  if (state.activeEffects.length === before) return;

  state.hero.health = Math.min(state.hero.health, getHeroMaxHealth());
  state.panelsDirty = true;
  queueSave("Iksir etkisi bitti");
}

function unequipItem(slot) {
  if (!state.equipped[slot]) return;
  delete state.equipped[slot];
  state.hero.health = Math.min(state.hero.health, getHeroMaxHealth());
  state.panelsDirty = true;
  queueSave("Ekipman kaydediliyor");
  render();
}

function triggerHeroShotAnimation() {
  els.heroWrap.classList.remove("shooting");
  void els.heroWrap.offsetWidth;
  els.heroWrap.classList.add("shooting");
  clearTimeout(heroShotTimer);
  heroShotTimer = window.setTimeout(() => {
    els.heroWrap.classList.remove("shooting");
  }, 720);
}

function fireArrow() {
  const arrow = document.createElement("span");
  arrow.className = "arrow";
  triggerHeroShotAnimation();
  playSound("arrow");
  positionProjectileLane();
  const distance = Math.max(120, els.projectileLane.getBoundingClientRect().width - 50);
  arrow.style.setProperty("--arrow-distance", `${distance}px`);
  els.projectileLane.append(arrow);
  arrow.addEventListener("animationend", () => arrow.remove(), { once: true });
}

function positionProjectileLane() {
  const combatants = document.querySelector(".combatants").getBoundingClientRect();
  const hero = document.querySelector(".hero-sprite").getBoundingClientRect();
  const enemy = els.enemyAvatar.getBoundingClientRect();
  const startX = hero.left + hero.width * 0.72 - combatants.left;
  const startY = hero.top + hero.height * 0.64 - combatants.top;
  const endX = enemy.left + enemy.width * 0.5 - combatants.left;

  els.projectileLane.style.left = `${startX}px`;
  els.projectileLane.style.top = `${startY}px`;
  els.projectileLane.style.width = `${Math.max(140, endX - startX)}px`;
}

function flashEnemy() {
  els.enemyAvatar.classList.remove("hit");
  void els.enemyAvatar.offsetWidth;
  els.enemyAvatar.classList.add("hit");
}

function showDamageNumber(damage, isCritical = false) {
  const popup = document.createElement("span");
  popup.className = `damage-popup${isCritical ? " critical" : ""}`;
  popup.textContent = isCritical ? `KRIT -${damage}` : `-${damage}`;
  popup.style.left = `${46 + randomBetween(-14, 14)}%`;
  popup.style.top = `${18 + randomBetween(-8, 8)}%`;
  els.enemyWrap.append(popup);
  popup.addEventListener("animationend", () => popup.remove(), { once: true });
}

function flashHero() {
  els.heroWrap.classList.remove("hit");
  void els.heroWrap.offsetWidth;
  els.heroWrap.classList.add("hit");
}

function lungeEnemy(now) {
  if (now < state.enemy.attackAnimUntil) return;

  els.enemyAvatar.classList.remove("attacking");
  void els.enemyAvatar.offsetWidth;
  state.enemy.activeAttackAnim = state.enemy.animations.attackAlt && Math.random() > 0.5 ? "attackAlt" : "attack";
  const attackAnim = state.enemy.animations[state.enemy.activeAttackAnim];
  state.enemy.attackAnimUntil = now + Math.max(380, attackAnim.frames * attackAnim.frameMs);
  els.enemyAvatar.classList.add("attacking");
}

function bonusParts(source) {
  return [
    source.damage ? `+${source.damage} hasar` : "",
    source.attackSpeed ? `+${Math.round(source.attackSpeed * 100)}% hiz` : "",
    source.maxHealth ? `+${source.maxHealth} can` : "",
  ].filter(Boolean);
}

function durationText(ms) {
  return ms ? `${Math.round(ms / 1000)} sn` : "";
}

function itemBonusText(item) {
  const tier = getItemTierConfig(item);
  const parts = [`T${getItemTier(item)} ${tier.label}`, `Lv ${getItemRequiredLevel(item)}`];

  if (getItemType(item) === "material") {
    parts.push("Parca");
  } else if (getItemType(item) === "potion") {
    parts.push(...bonusParts(getItemEffect(item)), durationText(getItemDuration(item)));
  } else {
    parts.push(...bonusParts(item));
  }

  return parts.filter(Boolean).join(", ");
}

function compactItemMeta(item) {
  const tier = getItemTierConfig(item);
  const type = getItemType(item);
  const typeLabel = type === "material" ? "Malzeme" : type === "potion" ? "İksir" : slotLabels[item.slot] || "Ekipman";
  return `T${getItemTier(item)} ${tier.label} / Lv ${getItemRequiredLevel(item)} / ${typeLabel}`;
}

function shopItemMeta(item) {
  const price = getShopItemPrice(item);
  return price < item.cost
    ? `${compactItemMeta(item)} / ${price} altın`
    : `${compactItemMeta(item)} / ${item.cost} altın`;
}

function isEquippedInventoryItem(item) {
  return getItemType(item) === "equipment" && state.equipped[item.slot]?.uid === item.uid;
}

function getVisibleInventoryItems() {
  return state.inventory.filter((item) => !isEquippedInventoryItem(item));
}

function getInventoryItemCount() {
  return getVisibleInventoryItems().reduce((total, item) => (
    total + (getItemType(item) === "material" ? getItemQuantity(item) : 1)
  ), 0);
}

// Panel render fonksiyonları: DOM yeniden çizimleri burada toplanıyor.
function renderStats() {
  els.statsGrid.innerHTML = "";
  const statIcons = {
    maxHealth: "HP",
    damage: "DMG",
    attackSpeed: "SPD",
  };
  Object.entries(upgradeConfig).forEach(([key, upgrade]) => {
    const cost = getUpgradeCost(key);
    const canBuy = state.gold >= cost;
    const row = document.createElement("div");
    row.className = `stat-row${canBuy ? " can-buy" : " cannot-buy"}`;
    row.dataset.stat = key;
    row.innerHTML = `
      <span class="stat-icon" aria-hidden="true">${statIcons[key] || "UP"}</span>
      <div>
        <strong>${upgrade.label}: ${upgrade.value()}</strong>
        <span>${upgrade.description} - ${cost} altın</span>
      </div>
      <button type="button" aria-label="${upgrade.label} satın al" ${canBuy ? "" : "disabled"}>${canBuy ? "Al" : "Yetersiz"}</button>
    `;
    row.querySelector("button").addEventListener("click", () => buyUpgrade(key));
    els.statsGrid.append(row);
  });
}

function renderTalentTree() {
  if (!els.talentTree || !els.talentPointsText) return;
  const points = Math.max(0, Number(state.hero.skillPoints) || 0);
  els.talentPointsText.textContent = `${points} puan`;
  els.talentTree.innerHTML = "";

  Object.entries(talentConfig).forEach(([key, talent]) => {
    const level = getTalentLevel(key);
    const isMaxed = level >= talent.max;
    const canBuy = points > 0 && !isMaxed;
    const row = document.createElement("div");
    row.className = `talent-row${canBuy ? " can-buy" : ""}${isMaxed ? " maxed" : ""}`;
    row.innerHTML = `
      <span class="talent-icon" aria-hidden="true">${talent.icon}</span>
      <div>
        <strong>${talent.label}</strong>
        <small>${talent.description}</small>
        <em>${talent.format(level)} / ${level}/${talent.max}</em>
      </div>
      <button type="button" ${canBuy ? "" : "disabled"}>${isMaxed ? "Max" : "Puan Ver"}</button>
    `;
    row.querySelector("button").addEventListener("click", () => buyTalent(key));
    els.talentTree.append(row);
  });
}

function getHeroPower() {
  return Math.round(state.hero.level * 85 + getHeroDamage() * 14 + getHeroMaxHealth() * 0.85 + getHeroAttackSpeed() * 140 + getTalentBonus("criticalDamage") * 500 + getLuckDropBonus() * 320);
}

function renderEquippedSummary() {
  els.equippedSummary.innerHTML = "";
  const powerRow = document.createElement("div");
  powerRow.className = "equipment-power-card";
  powerRow.innerHTML = `
    <span>Toplam Güç</span>
    <strong>${getHeroPower()}</strong>
    <small>${Math.round(getHeroDamage())} hasar / ${getHeroMaxHealth()} can / ${getHeroAttackSpeed().toFixed(2)}/sn</small>
  `;
  els.equippedSummary.append(powerRow);
  renderEquipmentDoll(els.equippedSummary);
}

function renderEnemyList() {
  els.enemyList.innerHTML = "";
  enemies.forEach((enemy) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "enemy-list-row bestiary-row";
    const entry = state.bestiary[enemy.name] || { kills: 0, drops: 0, highestLevel: 0, lastDrop: "" };
    row.innerHTML = `
      <span>${enemy.name}</span>
      <small>${entry.kills} öldürme / ${entry.drops} drop / en yüksek ${entry.highestLevel || "-"}</small>
      <em>Zayıflık: ${enemy.weakness || "Bilinmiyor"}</em>
      <em>Ganimet: ${enemy.dropInfo || "Genel loot"}${entry.lastDrop ? ` / son: ${entry.lastDrop}` : ""}</em>
    `;
    row.addEventListener("click", () => testEnemy(enemy.name));
    els.enemyList.append(row);
  });
}

function renderLeaderboard() {
  els.leaderboardList.innerHTML = "";
  if (!state.leaderboard.length) {
    els.leaderboardList.innerHTML = '<div class="leaderboard-empty">Henüz liderlik kaydı yok.</div>';
    return;
  }

  state.leaderboard.forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = `leaderboard-row${entry.username === state.session.username ? " current" : ""}`;
    row.innerHTML = `
      <span>${index + 1}</span>
      <strong>${entry.username}</strong>
      <small>Level ${entry.level} / Stage ${entry.wave}</small>
      <b>${entry.power} güç</b>
    `;
    els.leaderboardList.append(row);
  });
}


function renderRoadmap() {
  if (!state.roadmapStart) state.roadmapStart = getRoadmapBlockStart(state.wave);
  const blockStart = state.roadmapStart;
  const blockEnd = blockStart === 1 ? 50 : blockStart + 50;
  els.roadmapRange.textContent = `Stage ${blockStart} - ${blockEnd}`;
  els.roadmapStatus.innerHTML = "";

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "road-nav";
  previousButton.textContent = "<";
  previousButton.disabled = blockStart <= 1;
  previousButton.addEventListener("click", () => setRoadmapBlock(blockStart - 50));

  const statusText = document.createElement("span");
  statusText.textContent = `Stage ${state.stage.current}: ${state.stage.enemiesDefeated}/${state.stage.enemiesRequired} / Açık ${state.maxUnlockedLevel}`;

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "road-nav";
  nextButton.textContent = ">";
  nextButton.disabled = blockEnd >= state.maxUnlockedLevel;
  nextButton.addEventListener("click", () => setRoadmapBlock(blockStart === 1 ? 50 : blockStart + 50));

  els.roadmapStatus.append(previousButton, statusText, nextButton);
  els.roadmapGrid.innerHTML = "";

  for (let level = blockStart; level <= blockEnd; level += 1) {
    const isLocked = level > state.maxUnlockedLevel;
    const isCurrent = level === state.stage.current;
    const isCompleted = level < state.maxUnlockedLevel && !isCurrent;
    const isBoss = level % 10 === 0;
    const classes = ["road-level"];
    if (isCurrent) classes.push("current");
    if (isCompleted) classes.push("completed");
    if (isLocked) classes.push("locked");
    if (isBoss) classes.push("boss");
    const button = document.createElement("button");
    button.type = "button";
    button.className = classes.join(" ");
    button.textContent = level;
    button.title = isLocked ? "Bu stage için önce önceki stage'i geçmelisin" : `${isBoss ? "Boss " : ""}Stage ${level} seç`;
    button.dataset.locked = isLocked ? "true" : "false";
    button.dataset.state = isLocked ? "locked" : isCurrent ? "current" : isCompleted ? "completed" : "available";
    button.dataset.boss = isBoss ? "true" : "false";
    button.addEventListener("click", () => selectStageLevel(level));
    els.roadmapGrid.append(button);
  }
}

function renderStatusPanel() {
  const maxHealth = getHeroMaxHealth();
  const rows = [
    ["Level", state.hero.level],
    ["Can", `${Math.round(state.hero.health)} / ${maxHealth}`],
    ["Ortalama Hasar", Math.round(getHeroDamage())],
    ["Saldırı Hızı", `${getHeroAttackSpeed().toFixed(2)}/sn`],
    ["Yetenek Puanı", Math.max(0, Number(state.hero.skillPoints) || 0)],
    ["Kritik Hasar", `+${Math.round(getTalentBonus("criticalDamage") * 100)}%`],
    ["Dükkan İndirimi", `-${(getShopDiscountRate() * 100).toFixed(1)}%`],
    ["Şans", `+${(getLuckDropBonus() * 100).toFixed(1)}%`],
    ["Altın", state.gold],
    ["Stage", state.stage.current],
    ["Stage İlerlemesi", `${state.stage.enemiesDefeated}/${state.stage.enemiesRequired}`],
    ["Açık Stage", state.maxUnlockedLevel],
  ];

  const phaseText = state.stage.phase === "clear" ? "Stage tamamlandı" : state.stage.phase === "travel" ? "Yürüyor" : "Savaşta";
  els.statusHint.textContent = state.activeEffects.length > 0 ? `${phaseText} / ${state.activeEffects.length} iksir aktif` : phaseText;
  els.statusGrid.innerHTML = rows.map(([label, value]) => `
    <div class="status-row">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");
}

function renderShop() {
  els.shopList.innerHTML = "";
  if (state.shopStock.length === 0) state.shopStock = createInitialShopStock();
  const refreshCost = getShopRefreshCost();
  els.shopRefreshHint.textContent = `Stok yenileme: ${refreshCost} altın`;
  els.refreshShopButton.disabled = state.gold < refreshCost;
  els.refreshShopButton.textContent = `Yenile`;
  state.shopStock.forEach((item) => {
    const price = getShopItemPrice(item);
    const row = document.createElement("div");
    row.className = "item";
    applyTierStyle(row, item);
    row.innerHTML = `
      <img class="item-icon" src="${getItemIcon(item)}" alt="" draggable="false" />
      <div>
        <strong>${item.name}</strong>
        <small>${shopItemMeta(item)}</small>
      </div>
      <button type="button" ${state.gold < price ? "disabled" : ""}>Al</button>
    `;
    bindItemPreview(row, item);
    row.querySelector("button").addEventListener("click", () => buyItem(item.stockId));
    els.shopList.append(row);
  });
}

function renderInventory() {
  els.inventoryList.innerHTML = "";
  els.inventoryCount.textContent = `${getInventoryItemCount()} item`;
  const visibleInventory = getVisibleInventoryItems();

  if (visibleInventory.length === 0) {
    const empty = document.createElement("div");
    empty.className = "item empty-item";
    empty.innerHTML = "<div><strong>Çanta boş</strong><small>Giyili eşyalar Kuşanım alanında görünür. Yeni ganimet için düşman kes veya dükkandan item al.</small></div>";
    els.inventoryList.append(empty);
    return;
  }

  visibleInventory.forEach((item) => {
    const itemType = getItemType(item);
    const isMaterial = itemType === "material";
    const locked = isItemLocked(item);
    const levelLocked = !canEquipItem(item);
    const row = document.createElement("div");
    row.className = `item${levelLocked ? " locked" : ""}${locked ? " secured" : ""}`;
    row.draggable = true;
    row.dataset.uid = item.uid;
    applyTierStyle(row, item);
    const primaryText = itemType === "potion" ? "Ic" : levelLocked ? `Lv ${getItemRequiredLevel(item)}` : "Giy";
    const itemName = item.name;
    const quantityBadge = isMaterial ? `<span class="item-quantity">${getItemQuantity(item)}x</span>` : "";
    const lockButton = `<button type="button" data-action="lock">${locked ? "Aç" : "Kilitle"}</button>`;
    const actionsHtml = isMaterial
      ? `<button type="button" data-action="craft" ${locked ? "disabled" : ""}>Ekle</button>${lockButton}<button type="button" data-action="destroy" ${locked ? "disabled" : ""}>Yok Et</button>`
      : `<button type="button" data-action="primary" ${levelLocked ? "disabled" : ""}>${primaryText}</button>
        ${lockButton}
        <button type="button" data-action="salvage" ${locked ? "disabled" : ""}>Parcala</button><button type="button" data-action="destroy" ${locked ? "disabled" : ""}>Yok Et</button>`;
    row.innerHTML = `
      ${quantityBadge}
      <img class="item-icon" src="${getItemIcon(item)}" alt="" draggable="false" />
      <div>
        <strong>${itemName}</strong>
        <small>${compactItemMeta(item)}</small>
      </div>
      <div class="item-actions">
        ${actionsHtml}
      </div>
    `;
    bindItemPreview(row, item);
    row.addEventListener("dragstart", (event) => {
      state.draggingInventoryUid = item.uid;
      event.dataTransfer.setData("text/plain", item.uid);
      event.dataTransfer.effectAllowed = "move";
    });
    row.addEventListener("dragover", (event) => {
      const sourceUid = state.draggingInventoryUid;
      if (!sourceUid || sourceUid === item.uid) return;
      event.preventDefault();
      row.classList.add("drag-over");
    });
    row.addEventListener("dragleave", () => {
      row.classList.remove("drag-over");
    });
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      row.classList.remove("drag-over");
      swapInventoryItems(state.draggingInventoryUid || event.dataTransfer.getData("text/plain"), item.uid);
      state.draggingInventoryUid = "";
    });
    row.addEventListener("dragend", () => {
      state.draggingInventoryUid = "";
      document.querySelectorAll(".item.drag-over").forEach((element) => element.classList.remove("drag-over"));
    });
    row.querySelector("[data-action='primary']")?.addEventListener("click", () => {
      if (itemType === "potion") {
        usePotion(item.uid);
        return;
      }
      equipItem(item.uid);
    });
    row.querySelector("[data-action='lock']")?.addEventListener("click", () => toggleItemLock(item.uid));
    row.querySelector("[data-action='salvage']")?.addEventListener("click", () => salvageItem(item.uid));
    row.querySelector("[data-action='craft']")?.addEventListener("click", () => addMaterialToNextCraftSlot(item.uid));
    row.querySelector("[data-action='destroy']")?.addEventListener("click", () => destroyItem(item.uid));
    els.inventoryList.append(row);
  });
}

function renderCrafting() {
  els.craftingList.innerHTML = "";
  const slotItems = getCraftSlotItems();
  const filledCount = slotItems.filter(Boolean).length;
  els.craftHint.textContent = `${filledCount} / 3 parça`;
  els.craftButton.disabled = filledCount < 3;

  state.craftingSlots.forEach((uid, index) => {
    const item = slotItems[index];
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = `craft-slot${item ? " filled" : ""}`;
    slot.dataset.slotIndex = index;
    if (item) slot.style.setProperty("--tier-color", getItemTierConfig(item).color);
    slot.innerHTML = item
      ? `<img src="${getItemIcon(item)}" alt="" draggable="false" /><span>T${getItemTier(item)}</span><strong>${item.name}</strong>`
      : `<span>Boş Slot</span><strong>Parça sürükle</strong>`;
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("drag-over");
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("drag-over");
      assignCraftSlot(index, event.dataTransfer.getData("text/plain"));
    });
    slot.addEventListener("click", () => {
      if (item) clearCraftSlot(index);
    });
    els.craftingList.append(slot);
  });
}

function renderRecipeList() {
  els.recipeList.innerHTML = "";
  const slotItems = getCraftSlotItems().filter(Boolean);
  const row = document.createElement("div");
  row.className = "recipe-row craft-random-note";

  if (slotItems.length === 3) {
    const averageTier = slotItems.reduce((sum, item) => sum + getItemTier(item), 0) / slotItems.length;
    const tier = clamp(Math.round(averageTier), 1, 7);
    row.style.setProperty("--tier-color", tierConfig[tier].color);
    row.innerHTML = `
      <strong>Rastgele T${tier} item</strong>
      <small>Sonuç, koyduğun parçaların tier ortalamasına göre seçilir. Çok nadiren bir tier aşağı veya yukarı kayabilir.</small>
    `;
  } else {
    row.innerHTML = `
      <strong>Rastgele üretim</strong>
      <small>3 parça yerleştir. Yüksek tier parçalar daha yüksek tier item şansını artırır.</small>
    `;
  }

  els.recipeList.append(row);
}

function renderEquipmentDoll(container) {
  const doll = document.createElement("div");
  doll.className = "equipment-doll";
  doll.innerHTML = `
    <div class="equipment-avatar" aria-hidden="true">
      <div class="equipment-character-sprite"></div>
    </div>
  `;
  container.append(doll);

  Object.entries(slotLabels).forEach(([slot, label]) => {
    const equipped = state.equipped[slot];
    const slotEl = document.createElement("div");
    slotEl.className = `equip-slot doll-slot slot-${slot}${equipped ? " filled" : ""}`;
    slotEl.dataset.slot = slot;
    if (equipped) applyTierStyle(slotEl, equipped);
    slotEl.innerHTML = `
      <span>${label}</span>
      ${equipped ? `<img class="item-icon" src="${getItemIcon(equipped)}" alt="" draggable="false" />` : '<i class="empty-icon"></i>'}
      <strong>${equipped ? equipped.name : "Boş"}</strong>
      ${equipped ? '<button type="button">Çıkar</button>' : ""}
    `;

    slotEl.addEventListener("dragover", (event) => {
      event.preventDefault();
      slotEl.classList.add("drag-over");
    });
    slotEl.addEventListener("dragleave", () => slotEl.classList.remove("drag-over"));
    slotEl.addEventListener("drop", (event) => {
      event.preventDefault();
      slotEl.classList.remove("drag-over");
      const uid = event.dataTransfer.getData("text/plain");
      const item = state.inventory.find((entry) => entry.uid === uid);
      if (!item || getItemType(item) !== "equipment" || item.slot !== slot) return;
      equipItem(uid);
    });

    const button = slotEl.querySelector("button");
    if (button) button.addEventListener("click", () => unequipItem(slot));
    doll.append(slotEl);
  });
}

function renderPanelTabs() {
  if (state.activePanel === "equipment") state.activePanel = "status";
  els.panelTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.panelTab === state.activePanel);
  });
  els.panelViews.forEach((view) => {
    view.classList.toggle("active", view.dataset.panelView === state.activePanel);
  });
}

function renderPanels() {
  if (!state.panelsDirty) return;
  renderPanelTabs();
  renderRoadmap();
  renderStats();
  renderTalentTree();
  renderEquippedSummary();
  renderEnemyList();
  renderLeaderboard();
  renderStatusPanel();
  renderShop();
  renderInventory();
  renderCrafting();
  renderRecipeList();
  state.panelsDirty = false;
}

function render() {
  const maxHealth = getHeroMaxHealth();
  state.hero.health = Math.min(state.hero.health, maxHealth);
  const isTraveling = state.stage.phase === "travel" && state.heroDownUntil <= 0;

  els.stage.classList.toggle("stage-traveling", isTraveling);
  els.stage.classList.toggle("stage-combat", state.stage.phase === "combat");
  els.stage.classList.toggle("stage-no-enemy", !state.enemy);
  els.stage.classList.toggle("stage-boss", state.stage.current % 10 === 0);
  els.stage.classList.toggle("stage-danger", state.hero.health / Math.max(1, maxHealth) <= 0.25 || state.heroDownUntil > 0);
  els.heroWrap.classList.toggle("walking", isTraveling);
  if (isTraveling || state.heroDownUntil > 0) {
    els.heroWrap.classList.remove("shooting");
  }

  const showStageBanner = Boolean(state.stage.messageTitle && performance.now() < state.stage.messageUntil);
  els.stageBanner.hidden = !showStageBanner;
  if (showStageBanner) {
    els.stageBanner.dataset.type = state.stage.messageType || "info";
    els.stageBannerTitle.textContent = state.stage.messageTitle;
    els.stageBannerText.textContent = state.stage.messageText || "";
  }

  els.heroLevel.textContent = `Seviye ${state.hero.level}`;
  els.healthText.textContent = `${Math.round(state.hero.health)} / ${maxHealth}`;
  els.healthBar.style.width = `${(state.hero.health / maxHealth) * 100}%`;
  if (state.enemy) {
    els.enemyName.textContent = state.enemy.name;
    els.enemyLevel.textContent = `Tehdit ${state.enemy.level}`;
    els.enemyInitial.textContent = "";
    const enemyPositionForViewport = getEnemyPosition();
    els.enemyWrap.style.setProperty("--enemy-offset", `${Math.round(state.enemy.distance * enemyPositionForViewport.approachSpan + enemyPositionForViewport.contactOffset)}px`);
    const enemyHeight = els.enemyAvatar.getBoundingClientRect().height || 120;
    const enemyWidth = els.enemyAvatar.getBoundingClientRect().width || 120;
    const groundOffset = (Number(getEnemyGroundOffset()) || 0) * getMobileCombatScale();
    const healthTop = Math.round(Math.max(-12, groundOffset - enemyHeight * 0.16 - 12));
    const nameTop = Math.round(Math.max(2, groundOffset * 0.68 + 4));
    els.enemyWrap.style.setProperty("--enemy-health-top", `${healthTop}px`);
    els.enemyWrap.style.setProperty("--enemy-name-top", `${nameTop}px`);
    els.enemyWrap.style.setProperty("--enemy-health-width", `${Math.round(Math.max(68, Math.min(124, enemyWidth * 0.48)))}px`);
    els.enemyHealthText.textContent = `${state.enemy.health} / ${state.enemy.maxHealth}`;
    els.enemyHealthBar.style.width = `${(state.enemy.health / state.enemy.maxHealth) * 100}%`;
  } else {
    els.enemyName.textContent = "Yolda";
    els.enemyLevel.textContent = `Stage ${state.stage.current}`;
    els.enemyHealthText.textContent = `${state.stage.enemiesDefeated} / ${state.stage.enemiesRequired}`;
    els.enemyHealthBar.style.width = "0%";
  }
  els.xpText.textContent = `${state.hero.xp} / ${state.hero.xpToNext}`;
  els.xpBar.style.width = `${(state.hero.xp / state.hero.xpToNext) * 100}%`;
  els.goldText.textContent = state.gold;
  els.soundToggleButton.textContent = state.soundEnabled ? "Ses Açık" : "Ses Kapalı";
  els.pointsText.textContent = "Altınla geliştir";
  const effectText = state.activeEffects.length > 0 ? ` - ${state.activeEffects.length} iksir aktif` : "";
  els.shopHint.textContent = `${Math.round(getHeroDamage())} hasar - ${getHeroAttackSpeed().toFixed(2)}/sn${effectText}`;
  renderStatusPanel();
  renderPanels();
}

function renderEnemyFrame(now = performance.now()) {
  if (!state.enemy) return;
  const isAttacking = now < state.enemy.attackAnimUntil;
  const animName = getEnemyAnimationName(now);
  const anim = state.enemy.animations[animName];
  const renderScale = getMobileCombatScale();

  if (state.enemy.currentAnim !== animName || state.enemy.currentRenderScale !== renderScale) {
    state.enemy.currentAnim = animName;
    state.enemy.currentRenderScale = renderScale;
    state.enemy.spawnedAt = now;
    const frameWidth = anim.frameWidth || state.enemy.frameWidth;
    const frameHeight = anim.frameHeight || state.enemy.frameHeight;
    const displayWidth = Math.round((anim.width || state.enemy.width) * renderScale);
    const groundOffset = Math.round(getEnemyGroundOffset(animName) * renderScale);
    const attackLunge = Math.round((state.enemy.attackLunge ?? -34) * renderScale);
    els.enemyAvatar.style.backgroundImage = `url("${anim.image}")`;
    els.enemyAvatar.style.width = `${displayWidth}px`;
    els.enemyAvatar.style.aspectRatio = `${frameWidth} / ${frameHeight}`;
    els.enemyAvatar.style.backgroundSize = `${displayWidth * anim.frames}px 100%`;
    els.enemyAvatar.style.setProperty("--enemy-ground-y", `${groundOffset}px`);
    els.enemyAvatar.style.setProperty("--enemy-facing", state.enemy.facing || -1);
    els.enemyAvatar.style.setProperty("--enemy-lunge-x", `${attackLunge}px`);
    els.enemyAvatar.style.setProperty("--enemy-attack-scale", state.enemy.attackScale ?? 1.04);
  }

  const elapsedFrames = Math.floor((now - state.enemy.spawnedAt) / anim.frameMs);
  const frame = isAttacking ? Math.min(elapsedFrames, anim.frames - 1) : elapsedFrames % anim.frames;
  const frameDisplayWidth = els.enemyAvatar.getBoundingClientRect().width;
  els.enemyAvatar.style.backgroundPosition = `-${frame * frameDisplayWidth}px 0`;
}

function runGameStep(now, deltaSeconds) {
  if (!state.session.active) return;
  updateDeath(now);
  updateActiveEffects();
  updateStagePhase(now);
  if (state.stage.phase !== "combat" || !state.enemy) return;
  approachEnemy(deltaSeconds);
  attackEnemy(now);
  enemyAttackHero(now);
  if (now - state.session.lastAutoSaveAt > 5000) {
    state.session.lastAutoSaveAt = now;
    queueSave("Otomatik kayıt");
  }
}

function loop(now) {
  if (!state.session.active) {
    requestAnimationFrame(loop);
    return;
  }

  if (!document.hidden) {
    const deltaSeconds = state.lastFrameAt ? Math.min((now - state.lastFrameAt) / 1000, 0.08) : 0;
    state.lastFrameAt = now;
    runGameStep(now, deltaSeconds);
    render();
    renderEnemyFrame(now);
  }

  requestAnimationFrame(loop);
}

showAuthMessage("Giriş yap veya kayıt ol.");
requestAnimationFrame(loop);
