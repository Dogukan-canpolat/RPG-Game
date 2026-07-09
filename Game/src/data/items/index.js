import { buildEquipment, buildPotion, indexText, slotLabels } from "./builders.js";
import { materialItems, salvageMaterialsByTier } from "./materials.js";
import { tierConfig, tierFromGroupPosition, tierPower } from "./tiers.js";

export { materialItems, salvageMaterialsByTier, tierConfig };

export const shopItems = [
  buildEquipment({ id: "ash-bow", name: "Kül Avcı Yayı", slot: "weapon", tier: 1, rank: 0, cost: 420, icon: "assets/item-icons/pack1-Item__16.png" }),
  buildEquipment({ id: "ranger-cloak", name: "Gezgin Postu", slot: "armor", tier: 1, rank: 1, cost: 620, icon: "assets/item-icons/pack1-Item__60.png" }),
  buildEquipment({ id: "hunter-ring", name: "Avcı Yüzüğü", slot: "ring", tier: 2, rank: 0, cost: 1600, icon: "assets/item-icons/pack1-Item__40.png" }),
  buildEquipment({ id: "storm-bow", name: "Fırtına Yayı", slot: "weapon", tier: 2, rank: 2, cost: 2400, icon: "assets/item-icons/pack1-Item__19.png" }),
  buildEquipment({ id: "iron-helm", name: "Demir Başlık", slot: "helmet", tier: 2, rank: 1, cost: 2100, icon: "assets/item-icons/pack1-Item__44.png" }),
  buildEquipment({ id: "swift-gloves", name: "Çevik Eldiven", slot: "gloves", tier: 3, rank: 0, cost: 6200, icon: "assets/item-icons/pack1-Item__62.png" }),
  buildEquipment({ id: "moon-armor", name: "Ay Muhafız Zırhı", slot: "armor", tier: 4, rank: 0, cost: 22000, icon: "assets/item-icons/pack1-Item__59.png" }),
  buildEquipment({ id: "night-bow", name: "Gece Yaylımı", slot: "weapon", tier: 4, rank: 1, cost: 28500, icon: "assets/item-icons/pack1-Item__18.png" }),
  buildPotion({ id: "power-potion", name: "Güç İksiri", tier: 2, rank: 0, profile: "power", requiredLevel: 8, cost: 1800, icon: "assets/item-icons/pack1-Item__28.png" }),
  buildPotion({ id: "haste-potion", name: "Hız İksiri", tier: 2, rank: 1, profile: "haste", requiredLevel: 10, cost: 2200, icon: "assets/item-icons/pack1-Item__30.png" }),
  buildPotion({ id: "guardian-potion", name: "Muhafız İksiri", tier: 3, rank: 0, profile: "guard", requiredLevel: 24, cost: 5600, icon: "assets/item-icons/pack1-Item__31.png" }),
];

export const lootItems = [
  buildEquipment({ id: "fang-necklace", name: "Diş Kolyesi", slot: "ring", tier: 1, rank: 0, icon: "assets/item-icons/pack1-Item__34.png" }),
  buildEquipment({ id: "ember-gloves", name: "Köz Eldiveni", slot: "gloves", tier: 2, rank: 0, icon: "assets/item-icons/pack1-Item__61.png" }),
  buildEquipment({ id: "shadow-hood", name: "Gölge Başlığı", slot: "helmet", tier: 2, rank: 1, icon: "assets/item-icons/pack1-Item__55.png" }),
  buildEquipment({ id: "storm-string", name: "Fırtına Kirişi", slot: "weapon", tier: 2, rank: 2, icon: "assets/item-icons/pack1-Item__17.png" }),
  buildEquipment({ id: "bone-guard", name: "Kemik Muhafız", slot: "armor", tier: 3, rank: 0, icon: "assets/item-icons/pack1-Item__24.png" }),
  buildEquipment({ id: "blood-band", name: "Kan Halkası", slot: "ring", tier: 3, rank: 1, icon: "assets/item-icons/pack1-Item__42.png" }),
  buildEquipment({ id: "phantom-grip", name: "Hayalet Kavrayışı", slot: "gloves", tier: 3, rank: 2, icon: "assets/item-icons/pack1-Item__52.png" }),
  buildEquipment({ id: "void-crown", name: "Boşluk Tacı", slot: "helmet", tier: 4, rank: 1, icon: "assets/item-icons/pack1-Item__53.png" }),
  buildEquipment({ id: "eclipse-bow", name: "Tutulma Yayı", slot: "weapon", tier: 5, rank: 0, icon: "assets/item-icons/pack1-Item__23.png" }),
  buildEquipment({ id: "warden-plate", name: "Bekçi Zırhı", slot: "armor", tier: 5, rank: 1, icon: "assets/item-icons/pack1-Item__58.png" }),
  buildPotion({ id: "wild-power-potion", name: "Vahşi Güç İksiri", tier: 3, rank: 1, profile: "power", icon: "assets/item-icons/pack1-Item__29.png" }),
  buildPotion({ id: "ancient-haste-potion", name: "Kadim Hız İksiri", tier: 4, rank: 0, profile: "haste", icon: "assets/item-icons/pack1-Item__30.png" }),
];

const baseGeneratedData = [
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

const baseGeneratedItems = baseGeneratedData.map(([id, name, slot, tier, potionProfile], index) => {
  const icon = `assets/item-icons/pack2-Item_${indexText(index)}.png`;
  const rank = index % 4;
  return slot === "potion"
    ? buildPotion({ id, name, tier, rank, profile: potionProfile, icon })
    : buildEquipment({ id, name, slot, tier, rank, icon });
});

const classicIconNames = [
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

const extraIconNames = [
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

const classicIconItems = classicIconNames.map((name, index) => createAssetItem({
  idPrefix: "pack1",
  iconPrefix: "assets/item-icons/pack1-Item",
  name,
  index,
  doubleUnderscore: true,
}));

const extraIconItems = extraIconNames.map((name, offset) => createAssetItem({
  idPrefix: "pack2-extra",
  iconPrefix: "assets/item-icons/pack2-Item",
  name,
  index: offset + 47,
}));

const swordStaffData = [
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

const swordStaffItems = swordStaffData.map(([file, name, tier, rank]) => buildEquipment({
  id: `rpg-pack1-${file.replace(".png", "")}`,
  name,
  slot: "weapon",
  tier,
  rank,
  maxHealth: tier >= 7 ? Math.round(tierPower(tier, rank) * 0.38) : tier >= 5 ? Math.round(tierPower(tier, rank) * 0.18) : undefined,
  icon: `assets/item-icons/pack3-${file}`,
}));

const bootData = [
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

const bootItems = bootData.map(([file, name, tier, rank]) => buildEquipment({
  id: `boot-pack-${file.replace(".png", "")}`,
  name,
  slot: "boots",
  tier,
  rank,
  icon: `assets/item-icons/boot-${file}`,
}));

function rangeEntries(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function createNumberedIconItemsForGroup({ start, end, slot, type = "equipment", profile = "power", nameBase }) {
  const numbers = rangeEntries(start, end);
  return numbers.map((number, index) => {
    const tier = tierFromGroupPosition(index, numbers.length);
    const rank = index % 6;
    const file = `fa${number}.png`;
    const id = `fa-pack-fa${number}`;
    const fallbackName = `${tierConfig[tier].label} ${nameBase || slotLabels[slot] || "Item"}`;
    const icon = `assets/item-icons/fa-${file}`;

    return type === "potion"
      ? buildPotion({ id, name: fallbackName, tier, rank, profile, icon })
      : buildEquipment({ id, name: fallbackName, slot, tier, rank, icon });
  });
}

const numberedIconItems = [
  ...createNumberedIconItemsForGroup({ start: 1665, end: 1808, slot: "weapon", nameBase: "Silah" }),
  ...createNumberedIconItemsForGroup({ start: 1825, end: 1840, slot: "ring", nameBase: "Tilsim" }),
  ...createNumberedIconItemsForGroup({ start: 1841, end: 1842, type: "potion", profile: "haste", nameBase: "Iksir" }),
  ...createNumberedIconItemsForGroup({ start: 1843, end: 1852, slot: "ring", nameBase: "Yuzuk" }),
  ...createNumberedIconItemsForGroup({ start: 1853, end: 1856, slot: "boots", nameBase: "Bot" }),
  ...createNumberedIconItemsForGroup({ start: 1857, end: 1883, slot: "armor", nameBase: "Zirh" }),
  ...createNumberedIconItemsForGroup({ start: 1884, end: 1887, slot: "helmet", nameBase: "Baslik" }),
  ...createNumberedIconItemsForGroup({ start: 1888, end: 1904, slot: "armor", nameBase: "Robe" }),
  ...createNumberedIconItemsForGroup({ start: 1905, end: 1920, slot: "ring", nameBase: "Kolye" }),
  ...createNumberedIconItemsForGroup({ start: 1921, end: 1934, slot: "gloves", nameBase: "Eldiven" }),
  ...createNumberedIconItemsForGroup({ start: 1935, end: 1952, slot: "boots", nameBase: "Bot" }),
];

const generatedLootItems = [
  ...baseGeneratedItems,
  ...classicIconItems,
  ...extraIconItems,
  ...swordStaffItems,
  ...bootItems,
  ...numberedIconItems,
];

export const allLootItems = [...lootItems, ...generatedLootItems];
export const allShopItems = [...shopItems, ...allLootItems];
export const allItems = [...shopItems, ...allLootItems, ...materialItems];
export const itemCatalog = new Map(allItems.map((item) => [item.id, item]));

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

