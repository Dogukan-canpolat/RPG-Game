export const tierConfig = {
  1: { label: "Sıradan", color: "#b9aea3", dropWeight: 620, gemMin: 1, gemMax: 2 },
  2: { label: "Kaliteli", color: "#79d28b", dropWeight: 240, gemMin: 2, gemMax: 4 },
  3: { label: "Nadir", color: "#77a9ff", dropWeight: 100, gemMin: 4, gemMax: 7 },
  4: { label: "Destansı", color: "#b982ff", dropWeight: 33, gemMin: 8, gemMax: 13 },
  5: { label: "Efsanevi", color: "#f3be4f", dropWeight: 7, gemMin: 16, gemMax: 26 },
  6: { label: "Çok Efsanevi", color: "#ff4fd8", dropWeight: 1, gemMin: 32, gemMax: 48 },
};

export const shopItems = [
  { id: "ash-bow", name: "Kül Yayı", type: "equipment", slot: "weapon", tier: 1, requiredLevel: 1, cost: 260, damage: 8, attackSpeed: 0.05, icon: "assets/items/Item__16.png" },
  { id: "ranger-cloak", name: "Gezgin Pelerini", type: "equipment", slot: "armor", tier: 1, requiredLevel: 2, cost: 390, maxHealth: 55, icon: "assets/items/Item__60.png" },
  { id: "hunter-ring", name: "Avcı Yüzüğü", type: "equipment", slot: "ring", tier: 2, requiredLevel: 3, cost: 950, damage: 10, maxHealth: 20, icon: "assets/items/Item__40.png" },
  { id: "storm-bow", name: "Fırtına Yayı", type: "equipment", slot: "weapon", tier: 2, requiredLevel: 4, cost: 1350, damage: 20, attackSpeed: 0.12, icon: "assets/items/Item__19.png" },
  { id: "iron-helm", name: "Demir Başlık", type: "equipment", slot: "helmet", tier: 2, requiredLevel: 4, cost: 1180, maxHealth: 70, icon: "assets/items/Item__44.png" },
  { id: "swift-gloves", name: "Çevik Eldiven", type: "equipment", slot: "gloves", tier: 3, requiredLevel: 5, cost: 3600, damage: 7, attackSpeed: 0.1, icon: "assets/items/Item__62.png" },
  { id: "moon-armor", name: "Ay Zırhı", type: "equipment", slot: "armor", tier: 4, requiredLevel: 7, cost: 11800, maxHealth: 130, damage: 8, icon: "assets/items/Item__59.png" },
  { id: "night-bow", name: "Gece Yayı", type: "equipment", slot: "weapon", tier: 4, requiredLevel: 8, cost: 14600, damage: 34, attackSpeed: 0.18, icon: "assets/items/Item__18.png" },
  { id: "power-potion", name: "Güç İksiri", type: "potion", tier: 2, requiredLevel: 1, cost: 780, effect: { damage: 12 }, durationMs: 30000, icon: "assets/items/Item__28.png" },
  { id: "haste-potion", name: "Hız İksiri", type: "potion", tier: 2, requiredLevel: 1, cost: 920, effect: { attackSpeed: 0.28 }, durationMs: 30000, icon: "assets/items/Item__30.png" },
  { id: "guardian-potion", name: "Muhafız İksiri", type: "potion", tier: 3, requiredLevel: 3, cost: 2100, effect: { maxHealth: 90 }, durationMs: 45000, icon: "assets/items/Item__31.png" },
];

export const lootItems = [
  { id: "fang-necklace", name: "Diş Kolyesi", type: "equipment", slot: "ring", tier: 1, requiredLevel: 1, damage: 6, maxHealth: 12, icon: "assets/items/Item__34.png" },
  { id: "ember-gloves", name: "Köz Eldiveni", type: "equipment", slot: "gloves", tier: 2, requiredLevel: 2, damage: 8, attackSpeed: 0.04, icon: "assets/items/Item__61.png" },
  { id: "shadow-hood", name: "Gölge Başlığı", type: "equipment", slot: "helmet", tier: 1, requiredLevel: 3, maxHealth: 35, icon: "assets/items/Item__55.png" },
  { id: "storm-string", name: "Fırtına Kirişi", type: "equipment", slot: "weapon", tier: 2, requiredLevel: 4, damage: 14, attackSpeed: 0.08, icon: "assets/items/Item__17.png" },
  { id: "bone-guard", name: "Kemik Muhafız", type: "equipment", slot: "armor", tier: 2, requiredLevel: 5, maxHealth: 85, icon: "assets/items/Item__24.png" },
  { id: "blood-band", name: "Kan Halkası", type: "equipment", slot: "ring", tier: 3, requiredLevel: 6, damage: 14, maxHealth: 28, icon: "assets/items/Item__42.png" },
  { id: "phantom-grip", name: "Hayalet Kavrayış", type: "equipment", slot: "gloves", tier: 3, requiredLevel: 7, damage: 12, attackSpeed: 0.12, icon: "assets/items/Item__52.png" },
  { id: "void-crown", name: "Boşluk Tacı", type: "equipment", slot: "helmet", tier: 4, requiredLevel: 8, damage: 18, maxHealth: 55, icon: "assets/items/Item__53.png" },
  { id: "eclipse-bow", name: "Tutulma Yayı", type: "equipment", slot: "weapon", tier: 5, requiredLevel: 10, damage: 44, attackSpeed: 0.22, icon: "assets/items/Item__23.png" },
  { id: "warden-plate", name: "Bekçi Zırhı", type: "equipment", slot: "armor", tier: 5, requiredLevel: 11, maxHealth: 190, damage: 10, icon: "assets/items/Item__58.png" },
  { id: "wild-power-potion", name: "Vahşi Güç İksiri", type: "potion", tier: 3, requiredLevel: 3, damage: 0, effect: { damage: 18 }, durationMs: 40000, icon: "assets/items/Item__29.png" },
  { id: "ancient-haste-potion", name: "Kadim Hız İksiri", type: "potion", tier: 4, requiredLevel: 6, effect: { attackSpeed: 0.42 }, durationMs: 45000, icon: "assets/items/Item__30.png" },
];

export const packTwoLootItems = [
  { id: "pack2-squire-blade", name: "Çırak Kılıcı", type: "equipment", slot: "weapon", tier: 1, requiredLevel: 1, damage: 5, attackSpeed: 0.03, icon: "assets/items2/Item_00.png" },
  { id: "pack2-silver-needle", name: "Gümüş İğne", type: "equipment", slot: "weapon", tier: 1, requiredLevel: 1, damage: 6, attackSpeed: 0.04, icon: "assets/items2/Item_01.png" },
  { id: "pack2-iron-dagger", name: "Demir Hançer", type: "equipment", slot: "weapon", tier: 1, requiredLevel: 2, damage: 7, attackSpeed: 0.03, icon: "assets/items2/Item_02.png" },
  { id: "pack2-rusty-pick", name: "Paslı Kazma", type: "equipment", slot: "weapon", tier: 1, requiredLevel: 2, damage: 8, icon: "assets/items2/Item_03.png" },
  { id: "pack2-copper-spear", name: "Bakır Mızrak", type: "equipment", slot: "weapon", tier: 1, requiredLevel: 3, damage: 9, icon: "assets/items2/Item_04.png" },
  { id: "pack2-long-needle", name: "Uzun İğne", type: "equipment", slot: "weapon", tier: 1, requiredLevel: 3, damage: 10, attackSpeed: 0.03, icon: "assets/items2/Item_05.png" },
  { id: "pack2-hooked-axe", name: "Kancalı Balta", type: "equipment", slot: "weapon", tier: 2, requiredLevel: 4, damage: 14, icon: "assets/items2/Item_06.png" },
  { id: "pack2-ember-rod", name: "Köz Asası", type: "equipment", slot: "weapon", tier: 2, requiredLevel: 4, damage: 13, attackSpeed: 0.05, icon: "assets/items2/Item_07.png" },
  { id: "pack2-ice-spear", name: "Buz Mızrağı", type: "equipment", slot: "weapon", tier: 2, requiredLevel: 5, damage: 15, icon: "assets/items2/Item_08.png" },
  { id: "pack2-sun-pike", name: "Güneş Kargısı", type: "equipment", slot: "weapon", tier: 2, requiredLevel: 5, damage: 16, attackSpeed: 0.04, icon: "assets/items2/Item_09.png" },
  { id: "pack2-flame-lance", name: "Alev Kargısı", type: "equipment", slot: "weapon", tier: 2, requiredLevel: 6, damage: 18, icon: "assets/items2/Item_10.png" },
  { id: "pack2-verdant-lance", name: "Yosun Kargısı", type: "equipment", slot: "weapon", tier: 2, requiredLevel: 6, damage: 17, attackSpeed: 0.06, icon: "assets/items2/Item_11.png" },
  { id: "pack2-moon-hatchet", name: "Ay Baltası", type: "equipment", slot: "weapon", tier: 2, requiredLevel: 7, damage: 19, icon: "assets/items2/Item_12.png" },
  { id: "pack2-bone-cleaver", name: "Kemik Satır", type: "equipment", slot: "weapon", tier: 3, requiredLevel: 8, damage: 24, icon: "assets/items2/Item_13.png" },
  { id: "pack2-wolf-hatchet", name: "Kurt Baltası", type: "equipment", slot: "weapon", tier: 3, requiredLevel: 8, damage: 23, attackSpeed: 0.06, icon: "assets/items2/Item_14.png" },
  { id: "pack2-storm-axe", name: "Fırtına Baltası", type: "equipment", slot: "weapon", tier: 3, requiredLevel: 9, damage: 26, icon: "assets/items2/Item_15.png" },
  { id: "pack2-curved-fang", name: "Kıvrık Diş", type: "equipment", slot: "weapon", tier: 3, requiredLevel: 9, damage: 25, attackSpeed: 0.07, icon: "assets/items2/Item_16.png" },
  { id: "pack2-blackthorn-mace", name: "Karatiken Gürz", type: "equipment", slot: "weapon", tier: 3, requiredLevel: 10, damage: 28, icon: "assets/items2/Item_17.png" },
  { id: "pack2-miner-pick", name: "Usta Kazması", type: "equipment", slot: "weapon", tier: 3, requiredLevel: 10, damage: 27, icon: "assets/items2/Item_18.png" },
  { id: "pack2-oath-hammer", name: "Yemin Çekici", type: "equipment", slot: "weapon", tier: 3, requiredLevel: 11, damage: 30, icon: "assets/items2/Item_19.png" },
  { id: "pack2-golden-key", name: "Altın Anahtar", type: "equipment", slot: "ring", tier: 4, requiredLevel: 12, damage: 18, maxHealth: 85, icon: "assets/items2/Item_20.png" },
  { id: "pack2-dawn-ring", name: "Şafak Halkası", type: "equipment", slot: "ring", tier: 4, requiredLevel: 13, damage: 20, maxHealth: 95, attackSpeed: 0.06, icon: "assets/items2/Item_21.png" },
  { id: "pack2-golden-scythe", name: "Altın Orak", type: "equipment", slot: "weapon", tier: 4, requiredLevel: 14, damage: 40, attackSpeed: 0.1, icon: "assets/items2/Item_22.png" },
  { id: "pack2-night-scythe", name: "Gece Orağı", type: "equipment", slot: "weapon", tier: 6, requiredLevel: 45, damage: 118, attackSpeed: 0.28, icon: "assets/items2/Item_23.png" },
  { id: "pack2-frost-mace", name: "Buz Gürzü", type: "equipment", slot: "weapon", tier: 4, requiredLevel: 15, damage: 42, icon: "assets/items2/Item_24.png" },
  { id: "pack2-stone-pick", name: "Taş Kazması", type: "equipment", slot: "weapon", tier: 4, requiredLevel: 16, damage: 44, icon: "assets/items2/Item_25.png" },
  { id: "pack2-war-pick", name: "Savaş Kazması", type: "equipment", slot: "weapon", tier: 4, requiredLevel: 16, damage: 46, attackSpeed: 0.08, icon: "assets/items2/Item_26.png" },
  { id: "pack2-silver-hammer", name: "Gümüş Çekiç", type: "equipment", slot: "weapon", tier: 4, requiredLevel: 17, damage: 48, icon: "assets/items2/Item_27.png" },
  { id: "pack2-seer-staff", name: "Kahin Asası", type: "equipment", slot: "weapon", tier: 4, requiredLevel: 18, damage: 43, attackSpeed: 0.14, icon: "assets/items2/Item_28.png" },
  { id: "pack2-sun-staff", name: "Güneş Asası", type: "equipment", slot: "weapon", tier: 4, requiredLevel: 18, damage: 45, attackSpeed: 0.12, icon: "assets/items2/Item_29.png" },
  { id: "pack2-sky-staff", name: "Gök Asası", type: "equipment", slot: "weapon", tier: 5, requiredLevel: 22, damage: 62, attackSpeed: 0.15, icon: "assets/items2/Item_30.png" },
  { id: "pack2-royal-staff", name: "Kraliyet Asası", type: "equipment", slot: "weapon", tier: 5, requiredLevel: 24, damage: 68, attackSpeed: 0.16, icon: "assets/items2/Item_31.png" },
  { id: "pack2-blood-moon-charm", name: "Kan Ay Tılsımı", type: "equipment", slot: "ring", tier: 5, requiredLevel: 25, damage: 40, maxHealth: 120, icon: "assets/items2/Item_32.png" },
  { id: "pack2-ice-shard", name: "Buz Parçası", type: "equipment", slot: "ring", tier: 5, requiredLevel: 26, damage: 42, maxHealth: 135, icon: "assets/items2/Item_33.png" },
  { id: "pack2-mirror-shield", name: "Ayna Kalkanı", type: "equipment", slot: "armor", tier: 5, requiredLevel: 27, maxHealth: 260, damage: 24, icon: "assets/items2/Item_34.png" },
  { id: "pack2-forbidden-tome", name: "Yasak Kitap", type: "potion", tier: 5, requiredLevel: 28, effect: { damage: 58, attackSpeed: 0.22 }, durationMs: 55000, icon: "assets/items2/Item_35.png" },
  { id: "pack2-giant-elixir", name: "Dev İksiri", type: "potion", tier: 5, requiredLevel: 28, effect: { maxHealth: 360, damage: 28 }, durationMs: 60000, icon: "assets/items2/Item_36.png" },
  { id: "pack2-iron-mask", name: "Demir Maske", type: "equipment", slot: "helmet", tier: 5, requiredLevel: 29, maxHealth: 240, damage: 28, icon: "assets/items2/Item_37.png" },
  { id: "pack2-creator-crown", name: "Yaratıcı Tacı", type: "equipment", slot: "helmet", tier: 6, requiredLevel: 50, maxHealth: 520, damage: 72, attackSpeed: 0.12, icon: "assets/items2/Item_38.png" },
  { id: "pack2-witch-hat", name: "Cadı Şapkası", type: "equipment", slot: "helmet", tier: 5, requiredLevel: 30, maxHealth: 230, damage: 36, attackSpeed: 0.08, icon: "assets/items2/Item_39.png" },
  { id: "pack2-crimson-glove", name: "Kızıl Eldiven", type: "equipment", slot: "gloves", tier: 5, requiredLevel: 31, damage: 48, attackSpeed: 0.18, icon: "assets/items2/Item_40.png" },
  { id: "pack2-oracle-wand", name: "Kehanet Değneği", type: "equipment", slot: "weapon", tier: 5, requiredLevel: 32, damage: 74, attackSpeed: 0.18, icon: "assets/items2/Item_41.png" },
  { id: "pack2-oath-plate", name: "Yemin Zırhı", type: "equipment", slot: "armor", tier: 5, requiredLevel: 33, maxHealth: 330, damage: 30, icon: "assets/items2/Item_42.png" },
  { id: "pack2-celestial-gauntlets", name: "Göksel Eldiven", type: "equipment", slot: "gloves", tier: 6, requiredLevel: 48, damage: 92, attackSpeed: 0.3, icon: "assets/items2/Item_43.png" },
  { id: "pack2-abyss-hood", name: "Uçurum Başlığı", type: "equipment", slot: "helmet", tier: 6, requiredLevel: 52, maxHealth: 480, damage: 82, icon: "assets/items2/Item_44.png" },
  { id: "pack2-ancient-chest", name: "Kadim Göğüslük", type: "equipment", slot: "armor", tier: 6, requiredLevel: 55, maxHealth: 700, damage: 58, icon: "assets/items2/Item_45.png" },
  { id: "pack2-soul-skull", name: "Ruh Kafatası", type: "equipment", slot: "ring", tier: 6, requiredLevel: 60, damage: 105, maxHealth: 260, attackSpeed: 0.18, icon: "assets/items2/Item_46.png" },
];

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
};

const slotLabels = {
  weapon: "Silah",
  armor: "Zırh",
  helmet: "Başlık",
  gloves: "Eldiven",
  ring: "Yüzük",
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

function indexText(index) {
  return String(index).padStart(2, "0");
}

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
  if (index >= 64 || [23, 38, 43, 44, 45, 46].includes(index)) return 6;
  if (index >= 48 || index >= 30) return 5;
  if (index >= 20) return 4;
  if (index >= 12) return 3;
  if (index >= 6) return 2;
  return 1;
}

function createAssetItem({ idPrefix, iconPrefix, name, index, doubleUnderscore = false }) {
  const slotOrType = getSlotForIndex(index);
  const tier = getTierForIndex(index);
  const requiredLevel = Math.max(1, tier * 4 - 3 + (index % 3));
  const icon = `${iconPrefix}${doubleUnderscore ? "__" : "_"}${indexText(index)}.png`;

  if (slotOrType === "potion") {
    const potionStats = index % 3 === 0
      ? { damage: 10 + tier * 8 }
      : index % 3 === 1
        ? { attackSpeed: Number((0.12 + tier * 0.04).toFixed(2)) }
        : { maxHealth: 45 + tier * 55 };
    return {
      id: `${idPrefix}-${indexText(index)}`,
      name,
      type: "potion",
      tier,
      requiredLevel,
      effect: potionStats,
      durationMs: 30000 + tier * 6000,
      icon,
    };
  }

  const item = {
    id: `${idPrefix}-${indexText(index)}`,
    name,
    type: "equipment",
    slot: slotOrType,
    tier,
    requiredLevel,
    icon,
  };
  const statScale = 6 + tier * 9 + Math.round(index / 3);

  if (slotOrType === "weapon") {
    item.damage = statScale + tier * 4;
    if (index % 2 === 0) item.attackSpeed = Number((0.02 + tier * 0.025).toFixed(2));
  } else if (slotOrType === "armor" || slotOrType === "helmet") {
    item.maxHealth = statScale * 6 + tier * 20;
    if (tier >= 4) item.damage = tier * 5;
  } else if (slotOrType === "gloves") {
    item.damage = statScale;
    item.attackSpeed = Number((0.04 + tier * 0.035).toFixed(2));
  } else {
    item.damage = Math.round(statScale * 0.65);
    item.maxHealth = statScale * 3;
    if (tier >= 5) item.attackSpeed = Number((tier * 0.025).toFixed(2));
  }

  return item;
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

export const allLootItems = [...lootItems, ...packTwoLootItems, ...packOneAssetItems, ...packTwoExtraItems];
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
