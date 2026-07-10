import { getItemName } from "./names.js";
import { requiredLevel, tierPower } from "./tiers.js";

export const slotLabels = {
  weapon: "Silah",
  armor: "Zırh",
  helmet: "Başlık",
  gloves: "Eldiven",
  ring: "Yüzük",
  boots: "Bot",
};

export function indexText(index) {
  return String(index).padStart(2, "0");
}

function cleanItem(item) {
  return Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined && value !== null && value !== 0));
}

const equipmentStatProfiles = [
  { damage: 1.22, health: 0.82, speed: 0.88 },
  { damage: 0.88, health: 0.9, speed: 1.34 },
  { damage: 0.76, health: 1.45, speed: 0.76 },
  { damage: 1.03, health: 1.05, speed: 1.04 },
  { damage: 1.14, health: 1.18, speed: 0.92 },
  { damage: 0.96, health: 0.78, speed: 1.22 },
];

function hashText(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function uniqueFactor(seed, salt, min, max) {
  const mixed = Math.imul(seed ^ Math.imul(salt + 17, 2654435761), 2246822519) >>> 0;
  const unit = (mixed % 1000) / 999;
  return min + (max - min) * unit;
}

function getEquipmentIdentity(def) {
  const seed = hashText(`${def.id}|${def.name}|${def.slot}|${def.tier}|${def.rank || 0}|${def.icon || ""}`);
  const profile = equipmentStatProfiles[seed % equipmentStatProfiles.length];
  return { seed, profile };
}

function roundStat(value, min = 1) {
  return Math.max(min, Math.round(value));
}

function speedStat(value) {
  return Number(Math.max(0.01, value).toFixed(2));
}

function criticalChanceStat(def, seed) {
  if (Number.isFinite(def.criticalChance)) {
    return Number(Math.max(0, def.criticalChance).toFixed(3));
  }

  const tier = Math.max(1, Number(def.tier) || 1);
  const rank = Math.max(0, Number(def.rank) || 0);
  const slotBias = def.slot === "ring" ? 0.08 : def.slot === "weapon" || def.slot === "gloves" ? 0.05 : 0;
  const eligibility = Math.min(0.55, 0.14 + tier * 0.024 + slotBias);
  if (uniqueFactor(seed, 71, 0, 1) > eligibility) return undefined;

  const base = 0.003 + tier * 0.0009 + rank * 0.00015;
  return Number(Math.min(0.04, base * uniqueFactor(seed, 73, 1, 1.75)).toFixed(3));
}

export function buildEquipment(def) {
  const rank = def.rank || 0;
  const tier = def.tier;
  const slot = def.slot;
  const power = tierPower(tier, rank);
  const identity = getEquipmentIdentity(def);
  const { seed, profile } = identity;
  const variedDamage = (base, salt, min = 1) => roundStat(base * profile.damage * uniqueFactor(seed, salt, 0.9, 1.16), min);
  const variedHealth = (base, salt, min = 1) => roundStat(base * profile.health * uniqueFactor(seed, salt, 0.88, 1.18), min);
  const variedSpeed = (base, salt) => speedStat(base * profile.speed * uniqueFactor(seed, salt, 0.82, 1.22));
  const item = {
    id: def.id,
    name: getItemName(def.id, def.name),
    type: "equipment",
    slot,
    tier,
    requiredLevel: def.requiredLevel ?? requiredLevel(tier, rank),
    icon: def.icon,
    cost: def.cost,
  };
  item.criticalChance = criticalChanceStat(def, seed);

  if (slot === "weapon") {
    item.damage = def.damage ?? variedDamage(power, 3);
    item.attackSpeed = def.attackSpeed ?? variedSpeed(0.035 + tier * 0.028 + rank * 0.006, 5);
    item.maxHealth = def.maxHealth ?? (profile.health > 1.05 || tier >= 6 ? variedHealth(power * (0.28 + tier * 0.07), 7) : undefined);
  } else if (slot === "armor") {
    item.maxHealth = def.maxHealth ?? variedHealth(power * 3.15 + tier * 42, 11);
    item.damage = def.damage ?? (profile.damage > 1 || tier >= 4 ? variedDamage(power * (0.09 + tier * 0.024), 13) : undefined);
    item.attackSpeed = def.attackSpeed ?? (profile.speed > 1.18 ? variedSpeed(0.012 + tier * 0.008 + rank * 0.002, 17) : undefined);
  } else if (slot === "helmet") {
    item.maxHealth = def.maxHealth ?? variedHealth(power * 2.1 + tier * 24, 19);
    item.damage = def.damage ?? (tier >= 3 || profile.damage > 1.1 ? variedDamage(power * (0.16 + tier * 0.028), 23) : undefined);
    item.attackSpeed = def.attackSpeed ?? (profile.speed > 1.08 ? variedSpeed(0.012 + tier * 0.01, 29) : undefined);
  } else if (slot === "gloves") {
    item.damage = def.damage ?? variedDamage(power * 0.5, 31);
    item.attackSpeed = def.attackSpeed ?? variedSpeed(0.045 + tier * 0.028 + rank * 0.004, 37);
    item.maxHealth = def.maxHealth ?? (profile.health > 1.15 ? variedHealth(power * 0.95 + tier * 16, 41) : undefined);
  } else {
    item.damage = def.damage ?? variedDamage(power * (0.28 + tier * 0.025), 43);
    item.maxHealth = def.maxHealth ?? variedHealth(power * (1.0 + tier * 0.12), 47);
    item.attackSpeed = def.attackSpeed ?? (tier >= 4 || profile.speed > 1.12 ? variedSpeed(0.028 + tier * 0.014 + rank * 0.002, 53) : undefined);
  }

  return cleanItem(item);
}

export function buildPotion(def) {
  const rank = def.rank || 0;
  const tier = def.tier;
  const power = tierPower(tier, rank);
  const seed = hashText(`${def.id}|${def.name}|potion|${def.profile || "power"}|${tier}|${rank}|${def.icon || ""}`);
  const effectFactor = uniqueFactor(seed, 61, 0.88, 1.2);
  const durationFactor = uniqueFactor(seed, 67, 0.9, 1.15);
  const effect = def.effect || (
    def.profile === "haste"
      ? { attackSpeed: speedStat((0.18 + tier * 0.055 + rank * 0.01) * effectFactor) }
      : def.profile === "guard"
        ? { maxHealth: roundStat(power * 2.25 * effectFactor) }
        : { damage: roundStat(power * 0.72 * effectFactor) }
  );

  return {
    id: def.id,
    name: getItemName(def.id, def.name),
    type: "potion",
    tier,
    requiredLevel: def.requiredLevel ?? requiredLevel(tier, rank),
    cost: def.cost,
    effect,
    durationMs: def.durationMs ?? Math.round((90000 + tier * 14000 + rank * 4000) * durationFactor),
    icon: def.icon,
  };
}

export function buildFood(def) {
  const rank = def.rank || 0;
  const tier = def.tier;
  const power = tierPower(tier, rank);
  const seed = hashText(`${def.id}|${def.name}|food|${def.profile || "power"}|${tier}|${rank}|${def.icon || ""}`);
  const effectFactor = uniqueFactor(seed, 79, 0.88, 1.12);
  const durationFactor = uniqueFactor(seed, 83, 0.9, 1.1);
  const effect = def.effect || (
    def.profile === "haste"
      ? { attackSpeed: speedStat((0.06 + tier * 0.016 + rank * 0.004) * effectFactor) }
      : def.profile === "guard"
        ? { maxHealth: roundStat(power * 0.75 * effectFactor) }
        : { damage: roundStat(power * 0.25 * effectFactor) }
  );

  return {
    id: def.id,
    name: getItemName(def.id, def.name),
    type: "food",
    tier,
    requiredLevel: def.requiredLevel ?? requiredLevel(tier, rank),
    cost: def.cost,
    effect,
    durationMs: def.durationMs ?? Math.round((20000 + tier * 3000 + rank * 1000) * durationFactor),
    icon: def.icon,
  };
}
