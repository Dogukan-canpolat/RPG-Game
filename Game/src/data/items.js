export const tierConfig = {
  1: { label: "Sıradan", color: "#b9aea3", dropWeight: 620, gemMin: 1, gemMax: 2 },
  2: { label: "Kaliteli", color: "#79d28b", dropWeight: 240, gemMin: 2, gemMax: 4 },
  3: { label: "Nadir", color: "#77a9ff", dropWeight: 100, gemMin: 4, gemMax: 7 },
  4: { label: "Destansı", color: "#b982ff", dropWeight: 33, gemMin: 8, gemMax: 13 },
  5: { label: "Efsanevi", color: "#f3be4f", dropWeight: 7, gemMin: 16, gemMax: 26 },
  6: { label: "Çok Efsanevi", color: "#ff4fd8", dropWeight: 1, gemMin: 32, gemMax: 48 },
  7: { label: "İlahi", color: "#6ff7ff", dropWeight: 0.05, gemMin: 64, gemMax: 96 },
};

const tierLevelBase = { 1: 1, 2: 8, 3: 24, 4: 65, 5: 140, 6: 275, 7: 405 };
const tierLevelStep = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 14, 6: 22, 7: 35 };
const tierPowerBase = { 1: 10, 2: 24, 3: 52, 4: 105, 5: 215, 6: 420, 7: 820 };

const slotLabels = {
  weapon: "Silah",
  armor: "Zırh",
  helmet: "Başlık",
  gloves: "Eldiven",
  ring: "Yüzük",
  boots: "Bot",
};

function indexText(index) {
  return String(index).padStart(2, "0");
}

function requiredLevel(tier, rank = 0) {
  return Math.max(1, tierLevelBase[tier] + Math.max(0, rank) * tierLevelStep[tier]);
}

function tierPower(tier, rank = 0) {
  return Math.round(tierPowerBase[tier] * (1 + Math.max(0, rank) * 0.075));
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

function buildEquipment(def) {
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
    name: def.name,
    type: "equipment",
    slot,
    tier,
    requiredLevel: def.requiredLevel ?? requiredLevel(tier, rank),
    icon: def.icon,
    cost: def.cost,
  };

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

function buildPotion(def) {
  const rank = def.rank || 0;
  const tier = def.tier;
  const power = tierPower(tier, rank);
  const seed = hashText(`${def.id}|${def.name}|potion|${def.profile || "power"}|${tier}|${rank}|${def.icon || ""}`);
  const effectFactor = uniqueFactor(seed, 61, 0.88, 1.2);
  const durationFactor = uniqueFactor(seed, 67, 0.84, 1.24);
  const effect = def.effect || (
    def.profile === "haste"
      ? { attackSpeed: speedStat((0.18 + tier * 0.055 + rank * 0.01) * effectFactor) }
      : def.profile === "guard"
        ? { maxHealth: roundStat(power * 2.25 * effectFactor) }
        : { damage: roundStat(power * 0.72 * effectFactor) }
  );

  return {
    id: def.id,
    name: def.name,
    type: "potion",
    tier,
    requiredLevel: def.requiredLevel ?? requiredLevel(tier, rank),
    cost: def.cost,
    effect,
    durationMs: def.durationMs ?? Math.round((30000 + tier * 7000 + rank * 2500) * durationFactor),
    icon: def.icon,
  };
}

export const shopItems = [
  buildEquipment({ id: "ash-bow", name: "Kül Avcı Yayı", slot: "weapon", tier: 1, rank: 0, cost: 420, icon: "assets/items/Item__16.png" }),
  buildEquipment({ id: "ranger-cloak", name: "Gezgin Postu", slot: "armor", tier: 1, rank: 1, cost: 620, icon: "assets/items/Item__60.png" }),
  buildEquipment({ id: "hunter-ring", name: "Avcı Yüzüğü", slot: "ring", tier: 2, rank: 0, cost: 1600, icon: "assets/items/Item__40.png" }),
  buildEquipment({ id: "storm-bow", name: "Fırtına Yayı", slot: "weapon", tier: 2, rank: 2, cost: 2400, icon: "assets/items/Item__19.png" }),
  buildEquipment({ id: "iron-helm", name: "Demir Başlık", slot: "helmet", tier: 2, rank: 1, cost: 2100, icon: "assets/items/Item__44.png" }),
  buildEquipment({ id: "swift-gloves", name: "Çevik Eldiven", slot: "gloves", tier: 3, rank: 0, cost: 6200, icon: "assets/items/Item__62.png" }),
  buildEquipment({ id: "moon-armor", name: "Ay Muhafız Zırhı", slot: "armor", tier: 4, rank: 0, cost: 22000, icon: "assets/items/Item__59.png" }),
  buildEquipment({ id: "night-bow", name: "Gece Yaylımı", slot: "weapon", tier: 4, rank: 1, cost: 28500, icon: "assets/items/Item__18.png" }),
  buildPotion({ id: "power-potion", name: "Güç İksiri", tier: 2, rank: 0, profile: "power", requiredLevel: 8, cost: 1800, icon: "assets/items/Item__28.png" }),
  buildPotion({ id: "haste-potion", name: "Hız İksiri", tier: 2, rank: 1, profile: "haste", requiredLevel: 10, cost: 2200, icon: "assets/items/Item__30.png" }),
  buildPotion({ id: "guardian-potion", name: "Muhafız İksiri", tier: 3, rank: 0, profile: "guard", requiredLevel: 24, cost: 5600, icon: "assets/items/Item__31.png" }),
];

export const lootItems = [
  buildEquipment({ id: "fang-necklace", name: "Diş Kolyesi", slot: "ring", tier: 1, rank: 0, icon: "assets/items/Item__34.png" }),
  buildEquipment({ id: "ember-gloves", name: "Köz Eldiveni", slot: "gloves", tier: 2, rank: 0, icon: "assets/items/Item__61.png" }),
  buildEquipment({ id: "shadow-hood", name: "Gölge Başlığı", slot: "helmet", tier: 2, rank: 1, icon: "assets/items/Item__55.png" }),
  buildEquipment({ id: "storm-string", name: "Fırtına Kirişi", slot: "weapon", tier: 2, rank: 2, icon: "assets/items/Item__17.png" }),
  buildEquipment({ id: "bone-guard", name: "Kemik Muhafız", slot: "armor", tier: 3, rank: 0, icon: "assets/items/Item__24.png" }),
  buildEquipment({ id: "blood-band", name: "Kan Halkası", slot: "ring", tier: 3, rank: 1, icon: "assets/items/Item__42.png" }),
  buildEquipment({ id: "phantom-grip", name: "Hayalet Kavrayışı", slot: "gloves", tier: 3, rank: 2, icon: "assets/items/Item__52.png" }),
  buildEquipment({ id: "void-crown", name: "Boşluk Tacı", slot: "helmet", tier: 4, rank: 1, icon: "assets/items/Item__53.png" }),
  buildEquipment({ id: "eclipse-bow", name: "Tutulma Yayı", slot: "weapon", tier: 5, rank: 0, icon: "assets/items/Item__23.png" }),
  buildEquipment({ id: "warden-plate", name: "Bekçi Zırhı", slot: "armor", tier: 5, rank: 1, icon: "assets/items/Item__58.png" }),
  buildPotion({ id: "wild-power-potion", name: "Vahşi Güç İksiri", tier: 3, rank: 1, profile: "power", icon: "assets/items/Item__29.png" }),
  buildPotion({ id: "ancient-haste-potion", name: "Kadim Hız İksiri", tier: 4, rank: 0, profile: "haste", icon: "assets/items/Item__30.png" }),
];

const packTwoBaseData = [
  ["pack2-squire-blade", "Çırak Kılıcı", "weapon", 1], ["pack2-silver-needle", "Gümüş İğne", "weapon", 1],
  ["pack2-iron-dagger", "Demir Hançer", "weapon", 1], ["pack2-rusty-pick", "Paslı Kazma", "weapon", 1],
  ["pack2-copper-spear", "Bakır Mızrak", "weapon", 1], ["pack2-long-needle", "Uzun İğne", "weapon", 1],
  ["pack2-hooked-axe", "Kancalı Balta", "weapon", 2], ["pack2-ember-rod", "Köz Asası", "weapon", 2],
  ["pack2-ice-spear", "Buz Mızrağı", "weapon", 2], ["pack2-sun-pike", "Güneş Kargısı", "weapon", 2],
  ["pack2-flame-lance", "Alev Kargısı", "weapon", 2], ["pack2-verdant-lance", "Zümrüt Kargı", "weapon", 2],
  ["pack2-moon-hatchet", "Ay Baltası", "weapon", 3], ["pack2-bone-cleaver", "Kemik Satır", "weapon", 3],
  ["pack2-wolf-hatchet", "Kurt Baltası", "weapon", 3], ["pack2-storm-axe", "Fırtına Baltası", "weapon", 3],
  ["pack2-curved-fang", "Kıvrık Diş", "weapon", 3], ["pack2-blackthorn-mace", "Karatiken Gürz", "weapon", 3],
  ["pack2-miner-pick", "Usta Kazması", "weapon", 3], ["pack2-oath-hammer", "Yemin Çekici", "weapon", 3],
  ["pack2-golden-key", "Altın Anahtar", "ring", 4], ["pack2-dawn-ring", "Şafak Halkası", "ring", 4],
  ["pack2-golden-scythe", "Altın Orak", "weapon", 4], ["pack2-night-scythe", "Gece Orağı", "weapon", 6],
  ["pack2-frost-mace", "Buz Gürzü", "weapon", 4], ["pack2-stone-pick", "Taş Kazması", "weapon", 4],
  ["pack2-war-pick", "Savaş Kazması", "weapon", 4], ["pack2-silver-hammer", "Gümüş Çekiç", "weapon", 4],
  ["pack2-seer-staff", "Kahin Asası", "weapon", 4], ["pack2-sun-staff", "Güneş Asası", "weapon", 4],
  ["pack2-sky-staff", "Gök Asası", "weapon", 5], ["pack2-royal-staff", "Kraliyet Asası", "weapon", 5],
  ["pack2-blood-moon-charm", "Kan Ay Tılsımı", "ring", 5], ["pack2-ice-shard", "Buz Parçası", "ring", 5],
  ["pack2-mirror-shield", "Ayna Kalkanı", "armor", 5], ["pack2-forbidden-tome", "Yasak Kitap", "potion", 5, "power"],
  ["pack2-giant-elixir", "Dev İksiri", "potion", 5, "guard"], ["pack2-iron-mask", "Demir Maske", "helmet", 5],
  ["pack2-creator-crown", "Yaratıcı Tacı", "helmet", 6], ["pack2-witch-hat", "Cadı Şapkası", "helmet", 5],
  ["pack2-crimson-glove", "Kızıl Eldiven", "gloves", 5], ["pack2-oracle-wand", "Kehanet Değneği", "weapon", 5],
  ["pack2-oath-plate", "Yemin Göğüslüğü", "armor", 5], ["pack2-celestial-gauntlets", "Göksel Eldiven", "gloves", 6],
  ["pack2-abyss-hood", "Uçurum Başlığı", "helmet", 6], ["pack2-ancient-chest", "Kadim Göğüslük", "armor", 6],
  ["pack2-soul-skull", "Ruh Kafatası", "ring", 6],
];

export const packTwoLootItems = packTwoBaseData.map(([id, name, slot, tier, potionProfile], index) => {
  const icon = `assets/items2/Item_${indexText(index)}.png`;
  const rank = index % 4;
  return slot === "potion"
    ? buildPotion({ id, name, tier, rank, profile: potionProfile, icon })
    : buildEquipment({ id, name, slot, tier, rank, icon });
});

export const materialItems = [
  { id: "stick", name: "Dal Parçası", type: "material", tier: 1, requiredLevel: 1, icon: "assets/materials/stick.png" },
  { id: "copper-ore", name: "Bakır Cevheri", type: "material", tier: 1, requiredLevel: 1, icon: "assets/materials/copper_ore.png" },
  { id: "copper-ingot", name: "Bakır Külçesi", type: "material", tier: 2, requiredLevel: 1, icon: "assets/materials/copper_ingot.png" },
  { id: "iron-ore", name: "Demir Cevheri", type: "material", tier: 2, requiredLevel: 1, icon: "assets/materials/iron_ore.png" },
  { id: "iron-ingot", name: "Demir Külçesi", type: "material", tier: 3, requiredLevel: 1, icon: "assets/materials/iron_ingot.png" },
  { id: "silver-ore", name: "Gümüş Cevheri", type: "material", tier: 3, requiredLevel: 1, icon: "assets/materials/silver_ore.png" },
  { id: "silver-ingot", name: "Gümüş Külçesi", type: "material", tier: 4, requiredLevel: 1, icon: "assets/materials/silver_ingot.png" },
  { id: "gold-ore", name: "Altın Cevheri", type: "material", tier: 4, requiredLevel: 1, icon: "assets/materials/gold_ore.png" },
  { id: "gold-ingot", name: "Altın Külçesi", type: "material", tier: 5, requiredLevel: 1, icon: "assets/materials/gold_ingot.png" },
  { id: "platinum-ore", name: "Platin Cevheri", type: "material", tier: 5, requiredLevel: 1, icon: "assets/materials/platinum_ore.png" },
  { id: "platinum-ingot", name: "Platin Külçesi", type: "material", tier: 5, requiredLevel: 1, icon: "assets/materials/platinum_ingot.png" },
];

export const salvageMaterialsByTier = {
  1: ["stick", "copper-ore"],
  2: ["copper-ingot", "iron-ore"],
  3: ["iron-ingot", "silver-ore"],
  4: ["silver-ingot", "gold-ore"],
  5: ["gold-ingot", "platinum-ore", "platinum-ingot"],
  6: ["platinum-ingot", "gold-ingot", "platinum-ore"],
  7: ["platinum-ingot", "platinum-ingot", "gold-ingot"],
};

const packOneNames = [
  "Çatlak Kama", "Kül Bıçağı", "Avcı Kılıcı", "Kısa Kazma", "Bakır Mızrak", "İnce Kama", "Kancalı Balta", "Kızıl Asa",
  "Buzlu Mızrak", "Güneş Kargısı", "Alev Mızrağı", "Zümrüt Kargı", "Ay Baltası", "Kemik Satır", "Kurt Baltası", "Fırtına Baltası",
  "Kıvrık Diş", "Karatiken Gürz", "Usta Kazması", "Yemin Çekici", "Altın Anahtar", "Şafak Halkası", "Altın Orak", "Gölge Orağı",
  "Buz Gürzü", "Taş Kazması", "Savaş Kazması", "Gümüş Çekiç", "Güç Şişesi", "Vahşi İksir", "Hız Şişesi", "Muhafız İksiri",
  "Kan Ay Tılsımı", "Buz Parçası", "Ayna Kalkanı", "Yasak Kitap", "Dev İksiri", "Demir Maske", "Yaratıcı Tacı", "Cadı Şapkası",
  "Kızıl Eldiven", "Kehanet Değneği", "Yemin Göğüslüğü", "Göksel Eldiven", "Uçurum Başlığı", "Kadim Göğüslük", "Ruh Kafatası", "Karanlık Tılsım",
  "Yakut Bileklik", "Safir Bileklik", "Zümrüt Bileklik", "Obsidyen Yüzük", "Hayalet Eldiveni", "Gümüş Başlık", "Kuzgun Maskesi", "Işık Miğferi",
  "Koruyucu Zırh", "Avcı Zırhı", "Bekçi Zırhı", "Ay Pelerini", "Ejder Eldiveni", "Platin Eldiven", "Boşluk Eldiveni", "Sonsuzluk Halkası",
  "Ruh Miğferi", "Yıldız Zırhı", "Kadim Anahtar", "Kader Tılsımı", "Güneş Tacı", "Ay Tacı", "Platin Kafatası", "Evren Parçası",
];

const packTwoExtraNames = [
  "Köz Parşömeni", "Gümüş Pusula", "Savaş Sancağı", "Kara Kristal", "Gözcü Rozeti",
  "Ruh Çanı", "Avcı Broşu", "Yıldız Taşı", "Kutsal Mühür", "Sis Maskesi",
  "Gece Eldiveni", "Çelik Omuzluk", "Kuzgun Zırhı", "Kor Taşı", "Yaban Tılsımı",
  "Fırtına Mührü", "Zehir Şişesi", "Altın Şişe", "Platin Şişe", "Kraliyet Miğferi",
  "Boşluk Zırhı", "Ejder Pençesi", "Güneş Halkası", "Ay Halkası", "Sonsuzluk Tacı",
];

function getSlotForIndex(index) {
  if (index >= 28 && index <= 31) return "potion";
  if (index === 35 || index === 36 || index === 61 || index === 62 || index === 63) return "potion";
  if (index <= 27 || index === 41) return "weapon";
  if ([20, 21, 32, 33, 46, 47, 48, 49, 50, 51, 63, 66, 67, 70, 71].includes(index)) return "ring";
  if ([34, 42, 45, 56, 57, 58, 59, 65].includes(index)) return "armor";
  if ([37, 38, 39, 44, 53, 54, 55, 64, 68, 69].includes(index)) return "helmet";
  if ([40, 43, 52, 60, 61, 62].includes(index)) return "gloves";
  return "ring";
}

function getTierForIndex(index) {
  if ([68, 69, 70, 71].includes(index)) return 7;
  if (index >= 64 || [23, 38, 43, 44, 45, 46, 63].includes(index)) return 6;
  if (index >= 48 || index >= 30) return 5;
  if (index >= 20) return 4;
  if (index >= 12) return 3;
  if (index >= 6) return 2;
  return 1;
}

function createAssetItem({ idPrefix, iconPrefix, name, index, doubleUnderscore = false }) {
  const slotOrType = getSlotForIndex(index);
  const tier = getTierForIndex(index);
  const rank = index % 4;
  const icon = `${iconPrefix}${doubleUnderscore ? "__" : "_"}${indexText(index)}.png`;

  return slotOrType === "potion"
    ? buildPotion({ id: `${idPrefix}-${indexText(index)}`, name, tier, rank, profile: index % 3 === 1 ? "haste" : index % 3 === 2 ? "guard" : "power", icon })
    : buildEquipment({ id: `${idPrefix}-${indexText(index)}`, name, slot: slotOrType, tier, rank, icon });
}

const packOneAssetItems = packOneNames.map((name, index) => createAssetItem({
  idPrefix: "pack1",
  iconPrefix: "assets/items/Item",
  name,
  index,
  doubleUnderscore: true,
}));

const packTwoExtraItems = packTwoExtraNames.map((name, offset) => createAssetItem({
  idPrefix: "pack2-extra",
  iconPrefix: "assets/items2/Item",
  name,
  index: offset + 47,
}));

const rpgPackOneData = [
  ["sword6.png", "Kızıl Çelik Kılıç", 3, 0], ["sword7.png", "Gümüş Uzun Kılıç", 3, 1],
  ["sword8.png", "Ayaz Palası", 3, 2], ["sword9.png", "Altın Muhafız Kılıcı", 4, 0],
  ["sword10.png", "Buzul Keskinliği", 4, 1], ["sword11.png", "Gök Çeliği", 4, 2],
  ["sword12.png", "Fırtına Dişi", 4, 3], ["sword13.png", "Kanlı Yemin", 5, 0],
  ["sword14.png", "Güneş Sırtı", 5, 1], ["sword15.png", "Kor Ağızlı Kılıç", 5, 2],
  ["sword16.png", "Obsidyen Kıyıcı", 5, 3], ["sword17.png", "Kutsal Keskinlik", 6, 0],
  ["sword18.png", "Kristal Yarık", 6, 1], ["sword19.png", "Safir Taçlı Kılıç", 6, 2],
  ["sword20.png", "Pembe Ruh Kılıcı", 6, 3], ["sword21.png", "Soğuk Yıldız", 6, 4],
  ["sword22.png", "İlahi Mızrak Kılıcı", 7, 0], ["sword23.png", "Kaderin Ucu", 7, 1],
  ["sword24.png", "Mavi Sonsuzluk", 7, 2], ["sword25.png", "Kozmik Kesik", 7, 3],
  ["sword26.png", "Sessiz Mahşer", 7, 4], ["sword27.png", "Tanrı Parıltısı", 7, 5],
  ["staff25.png", "Kızıl Mühür Asası", 5, 1], ["staff26.png", "Kan Ayini Asası", 5, 2],
  ["staff27.png", "Mor Kehanet Asası", 5, 3], ["staff28.png", "Gece Kıvılcımı", 5, 4],
  ["staff29.png", "Ay Tozu Asası", 6, 0], ["staff30.png", "Mor Yıldız Asası", 6, 1],
  ["staff31.png", "Altın Kehanet", 6, 2], ["staff32.png", "Güneş Anahtarı", 6, 3],
  ["staff33.png", "Ak Ruh Asası", 7, 0], ["staff34.png", "Kızıl Felaket", 7, 1],
  ["staff35.png", "Gözleyen Asa", 7, 2], ["staff36.png", "Mahşer Mührü", 7, 3],
  ["staff37.png", "Zümrüt Sonsuzluk", 7, 4],
];

export const rpgPackOneItems = rpgPackOneData.map(([file, name, tier, rank]) => buildEquipment({
  id: `rpg-pack1-${file.replace(".png", "")}`,
  name,
  slot: "weapon",
  tier,
  rank,
  maxHealth: tier >= 7 ? Math.round(tierPower(tier, rank) * 0.38) : tier >= 5 ? Math.round(tierPower(tier, rank) * 0.18) : undefined,
  icon: `assets/items3/${file}`,
}));

const bootPackData = [
  ["fa1937.png", "Tozlu Yol Botu", 1, 0],
  ["fa1938.png", "Solgun Deri Bot", 1, 1],
  ["fa1939.png", "Yosun İzci Botu", 2, 0],
  ["fa1940.png", "Zümrüt Adım Botu", 2, 1],
  ["fa1941.png", "Kor Kıvılcım Botu", 2, 2],
  ["fa1942.png", "Sis Yürüyüş Botu", 3, 0],
  ["fa1943.png", "Güneş Kıvılcımı Çizmesi", 3, 1],
  ["fa1944.png", "Alacakaranlık Botu", 3, 2],
  ["fa1945.png", "Kan Bağı Çizmesi", 4, 0],
  ["fa1946.png", "Orman Nöbetçisi Botu", 4, 1],
  ["fa1947.png", "Ruh Patikası Botu", 4, 2],
  ["fa1948.png", "Kızıl Akın Çizmesi", 5, 0],
  ["fa1949.png", "Ayaz İz Botu", 5, 1],
  ["fa1950.png", "Altın Şafak Çizmesi", 5, 2],
  ["fa1951.png", "Mor Gölge Çizmesi", 6, 0],
  ["fa1952.png", "Kadim Gece Çizmesi", 7, 0],
];

export const bootPackItems = bootPackData.map(([file, name, tier, rank]) => buildEquipment({
  id: `boot-pack-${file.replace(".png", "")}`,
  name,
  slot: "boots",
  tier,
  rank,
  icon: `assets/boots/${file}`,
}));

export const allLootItems = [...lootItems, ...packTwoLootItems, ...packOneAssetItems, ...packTwoExtraItems, ...rpgPackOneItems, ...bootPackItems];
export const allShopItems = [...shopItems, ...allLootItems];
export const itemCatalog = new Map([...shopItems, ...allLootItems, ...materialItems].map((item) => [item.id, item]));

export const craftRecipes = [
  { id: "recipe-apprentice-blade", name: "Çırak Kılıcı", materialIds: ["stick", "copper-ore", "copper-ore"], resultId: "pack2-squire-blade" },
  { id: "recipe-ember-rod", name: "Köz Asası", materialIds: ["stick", "copper-ingot", "iron-ore"], resultId: "pack2-ember-rod" },
  { id: "recipe-storm-axe", name: "Fırtına Baltası", materialIds: ["stick", "iron-ingot", "silver-ore"], resultId: "pack2-storm-axe" },
  { id: "recipe-mirror-shield", name: "Ayna Kalkanı", materialIds: ["iron-ingot", "silver-ingot", "gold-ore"], resultId: "pack2-mirror-shield" },
  { id: "recipe-night-scythe", name: "Gece Orağı", materialIds: ["gold-ingot", "platinum-ore", "platinum-ingot"], resultId: "pack2-night-scythe" },
  { id: "recipe-creator-crown", name: "Yaratıcı Tacı", materialIds: ["platinum-ingot", "platinum-ingot", "gold-ingot"], resultId: "pack2-creator-crown" },
];

export function getSlotLabel(slot) {
  return slotLabels[slot] || "Item";
}
