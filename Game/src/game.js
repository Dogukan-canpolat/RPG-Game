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
    stats: {
      vitality: 0,
      power: 0,
      haste: 0,
    },
  },
  enemy: null,
  wave: 1,
  maxUnlockedLevel: 1,
  roadmapStart: 1,
  inventory: [],
  equipped: {},
  shopStock: [],
  craftingSlots: [null, null, null],
  activePanel: "shop",
  activeEffects: [],
  killsSinceLoot: 0,
  lastEnemyName: "",
  lastAttackAt: 0,
  lastEnemyAttackAt: 0,
  heroDownUntil: 0,
  lastFrameAt: 0,
  draggingInventoryUid: "",
  panelsDirty: true,
};

const enemyPosition = {
  approachSpan: 285,
  contactOffset: -92,
};

const enemies = [
  {
    name: "Hallokin",
    width: 500,
    frameWidth: 192,
    frameHeight: 128,
    groundOffset: 123,
    facing: -1,
    animations: {
      idle: { image: "assets/enemies/hallokin/idle.png", frames: 6, frameMs: 120 },
      run: { image: "assets/enemies/hallokin/run.png", frames: 4, frameMs: 90 },
      attack: { image: "assets/enemies/hallokin/attack.png", frames: 6, frameMs: 85 },
    },
  },
  {
    name: "VFX Yarasa",
    width: 240,
    frameWidth: 64,
    frameHeight: 64,
    groundOffset: 24,
    facing: 1,
    animations: {
      idle: { image: "assets/enemies/bat/idle.png", frames: 9, frameMs: 95 },
      run: { image: "assets/enemies/bat/run.png", frames: 8, frameMs: 80 },
      attack: { image: "assets/enemies/bat/attack.png", frames: 8, frameMs: 75 },
    },
  },
  {
    name: "Kör Avcı",
    width: 390,
    frameWidth: 240,
    frameHeight: 128,
    groundOffset: 73,
    facing: -1,
    animations: {
      idle: { image: "assets/enemies/huntress/idle.png", frames: 12, frameMs: 105 },
      run: { image: "assets/enemies/huntress/run.png", frames: 8, frameMs: 85 },
      attack: { image: "assets/enemies/huntress/attack.png", frames: 3, frameMs: 95 },
    },
  },
  {
    name: "Bataklık Gölgesi",
    width: 500,
    frameWidth: 247,
    frameHeight: 87,
    groundOffset: 0,
    facing: -1,
    animations: {
      idle: { image: "assets/enemies/wetlands-boss/idle.png", frames: 14, frameMs: 100 },
      run: { image: "assets/enemies/wetlands-boss/run.png", frames: 14, frameMs: 85 },
      attack: { image: "assets/enemies/wetlands-boss/attack.png", frames: 10, frameMs: 75 },
    },
  },
  {
    name: "Minotor",
    width: 220,
    frameWidth: 96,
    frameHeight: 96,
    groundOffset: 70,
    facing: -1,
    animations: {
      idle: { image: "assets/enemies/minotaur/idle.png", frames: 5, frameMs: 130 },
      run: { image: "assets/enemies/minotaur/run.png", frames: 8, frameMs: 90 },
      attack: { image: "assets/enemies/minotaur/attack.png", frames: 9, frameMs: 80 },
    },
  },
  {
    name: "Boşluk Azraili",
    width: 340,
    frameWidth: 250,
    frameHeight: 250,
    groundOffset: 102,
    facing: -1,
    animations: {
      idle: { image: "assets/enemies/void-reaper/run.png", frames: 8, frameMs: 120 },
      run: { image: "assets/enemies/void-reaper/run.png", frames: 8, frameMs: 80 },
      attack: { image: "assets/enemies/void-reaper/attack2.png", frames: 8, frameMs: 85 },
      attackAlt: { image: "assets/enemies/void-reaper/attack1.png", frames: 8, frameMs: 85 },
      death: { image: "assets/enemies/void-reaper/death.png", frames: 7, frameMs: 110 },
    },
  },
  {
    name: "İskelet Savaşçı",
    width: 180,
    frameWidth: 43,
    frameHeight: 37,
    groundOffset: 7,
    facing: -1,
    attackLunge: -8,
    animations: {
      idle: { image: "assets/enemies/skeleton/walk.png", frames: 13, frameMs: 130, frameWidth: 22, frameHeight: 33, width: 118 },
      run: { image: "assets/enemies/skeleton/walk.png", frames: 13, frameMs: 80, frameWidth: 22, frameHeight: 33, width: 118 },
      attack: { image: "assets/enemies/skeleton/attack_body_anchor.png", frames: 18, frameMs: 95, frameWidth: 72, frameHeight: 37.5, width: 330 },
      death: { image: "assets/enemies/skeleton/death.png", frames: 15, frameMs: 85, frameWidth: 33, frameHeight: 32, width: 174 },
    },
  },
  {
    name: "Kızıl Şövalye",
    width: 248,
    frameWidth: 96,
    frameHeight: 64,
    groundOffset: 44,
    facing: -1,
    attackLunge: -20,
    animations: {
      idle: { image: "assets/enemies/knight/run.png", frames: 8, frameMs: 150 },
      run: { image: "assets/enemies/knight/run.png", frames: 8, frameMs: 82 },
      attack: { image: "assets/enemies/knight/attack_stable.png", frames: 24, frameMs: 44, frameWidth: 132, frameHeight: 64, width: 340 },
      death: { image: "assets/enemies/knight/death.png", frames: 15, frameMs: 90, frameWidth: 96, frameHeight: 64, width: 248 },
    },
  },
  {
    name: "Nekromant",
    width: 220,
    frameWidth: 96,
    frameHeight: 96,
    groundOffset: 52,
    facing: -1,
    attackLunge: 0,
    attackScale: 1,
    animations: {
      idle: { image: "assets/enemies/necromancer/walk.png", frames: 10, frameMs: 150 },
      run: { image: "assets/enemies/necromancer/walk.png", frames: 10, frameMs: 95 },
      attack: { image: "assets/enemies/necromancer/attack_stable.png", frames: 47, frameMs: 24, frameWidth: 128, frameHeight: 128, width: 292, groundOffset: 88 },
      death: { image: "assets/enemies/necromancer/death.png", frames: 52, frameMs: 58, frameWidth: 96, frameHeight: 96, width: 220 },
    },
  },
];

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

const tierConfig = {
  1: { label: "Sıradan", color: "#b9aea3", dropWeight: 620, gemMin: 1, gemMax: 2 },
  2: { label: "Kaliteli", color: "#79d28b", dropWeight: 240, gemMin: 2, gemMax: 4 },
  3: { label: "Nadir", color: "#77a9ff", dropWeight: 100, gemMin: 4, gemMax: 7 },
  4: { label: "Destansı", color: "#b982ff", dropWeight: 33, gemMin: 8, gemMax: 13 },
  5: { label: "Efsanevi", color: "#f3be4f", dropWeight: 7, gemMin: 16, gemMax: 26 },
  6: { label: "Çok Efsanevi", color: "#ff4fd8", dropWeight: 1, gemMin: 32, gemMax: 48 },
};

const shopItems = [
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

const lootItems = [
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

const packTwoLootItems = [
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

const materialItems = [
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

const salvageMaterialsByTier = {
  1: ["stick", "copper-ore"],
  2: ["copper-ingot", "iron-ore"],
  3: ["iron-ingot", "silver-ore"],
  4: ["silver-ingot", "gold-ore"],
  5: ["gold-ingot", "platinum-ore", "platinum-ingot"],
  6: ["platinum-ingot", "gold-ingot", "platinum-ore"],
};

const allLootItems = [...lootItems, ...packTwoLootItems];
const itemCatalog = new Map([...shopItems, ...allLootItems, ...materialItems].map((item) => [item.id, item]));

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

function createSaveData() {
  return {
    gold: state.gold,
    gems: 0,
    hero: structuredClone(state.hero),
    wave: state.wave,
    maxUnlockedLevel: state.maxUnlockedLevel,
    inventory: structuredClone(state.inventory),
    equipped: structuredClone(state.equipped),
    shopStock: structuredClone(state.shopStock),
    activeEffects: serializeActiveEffects(),
    killsSinceLoot: state.killsSinceLoot,
    lastEnemyName: state.lastEnemyName,
    enemy: state.enemy ? serializeEnemy(state.enemy) : null,
    savedAt: new Date().toISOString(),
  };
}

function getXpForNextLevel(level) {
  const safeLevel = Math.max(1, Number(level) || 1);
  return Math.round(85 + Math.pow(safeLevel, 1.62) * 58 + safeLevel * 22);
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
  const replacements = [
    ["ZÄ±rh", "Zırh"],
    ["SÄ±radan", "Sıradan"],
    ["BirleÅŸik", "Birleşik"],
    ["DiÅŸ", "Diş"],
    ["BoÅŸluk", "Boşluk"],
    ["TacÄ±", "Tacı"],
    ["YayÄ±", "Yayı"],
    ["BaÅŸlÄ±k", "Başlık"],
    ["YÃ¼zÃ¼k", "Yüzük"],
    ["GÃ¼Ã§", "Güç"],
    ["Ä°ksiri", "İksiri"],
    ["HÄ±z", "Hız"],
    ["MuhafÄ±z", "Muhafız"],
    ["KÃ¶z", "Köz"],
    ["GÃ¶lge", "Gölge"],
    ["KiriÅŸi", "Kirişi"],
    ["HalkasÄ±", "Halkası"],
    ["KavrayÄ±ÅŸ", "Kavrayış"],
    ["BekÃ§i", "Bekçi"],
    ["VahÅŸi", "Vahşi"],
    ["Ã‡evik", "Çevik"],
  ];

  return replacements.reduce((text, [from, to]) => text.replaceAll(from, to), value);
}

function normalizeSavedItem(item) {
  if (!item || typeof item !== "object") return item;
  const catalogItem = itemCatalog.get(item.id);
  return {
    ...item,
    name: catalogItem?.name || normalizeVisibleText(item.name),
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

function getShopTemplatePool() {
  const heroLevel = Math.max(1, Number(state.hero.level) || 1);
  return [...shopItems, ...packTwoLootItems]
    .filter((item) => getItemType(item) !== "material")
    .filter((item) => getItemTier(item) < 6 || heroLevel >= Math.max(35, getItemRequiredLevel(item) - 10));
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
    weapon: ["assets/items/Item__16.png", "assets/items/Item__17.png", "assets/items/Item__19.png", "assets/items/Item__18.png", "assets/items/Item__23.png", "assets/items2/Item_23.png"],
    armor: ["assets/items/Item__60.png", "assets/items/Item__24.png", "assets/items/Item__59.png", "assets/items/Item__58.png", "assets/items/Item__58.png", "assets/items2/Item_45.png"],
    helmet: ["assets/items/Item__55.png", "assets/items/Item__44.png", "assets/items/Item__53.png", "assets/items/Item__53.png", "assets/items/Item__53.png", "assets/items2/Item_38.png"],
    gloves: ["assets/items/Item__61.png", "assets/items/Item__62.png", "assets/items/Item__52.png", "assets/items/Item__52.png", "assets/items/Item__52.png", "assets/items2/Item_43.png"],
    ring: ["assets/items/Item__34.png", "assets/items/Item__40.png", "assets/items/Item__42.png", "assets/items/Item__42.png", "assets/items/Item__42.png", "assets/items2/Item_46.png"],
  };
  return icons[slot]?.[Math.max(0, tier - 1)] || "assets/items/Item__00.png";
}

function createGeneratedEquipment(tier, source = "shop", previousCost = 80) {
  const slot = randomChoice(Object.keys(slotLabels));
  const statScale = tier * 8 + Math.round(state.wave * 1.8);
  const item = {
    id: `${source}-${slot}-${tier}-${crypto.randomUUID()}`,
    name: `${tierConfig[tier].label} ${slotLabels[slot]}`,
    type: "equipment",
    slot,
    tier,
    requiredLevel: Math.max(1, tier * 2 - 1),
    cost: Math.round(previousCost * 2.15 + getMinimumShopCost({ tier, type: "equipment", requiredLevel: Math.max(1, tier * 2 - 1) }) + state.wave * 90),
    icon: getGeneratedIcon(slot, tier),
  };

  if (slot === "weapon") {
    item.damage = statScale + tier * 5;
    item.attackSpeed = Number((0.03 + tier * 0.035).toFixed(2));
  } else if (slot === "armor" || slot === "helmet") {
    item.maxHealth = statScale * 7 + tier * 20;
    if (tier >= 4) item.damage = tier * 4;
  } else if (slot === "gloves") {
    item.damage = statScale;
    item.attackSpeed = Number((0.04 + tier * 0.03).toFixed(2));
  } else {
    item.damage = Math.round(statScale * 0.8);
    item.maxHealth = statScale * 3;
  }

  return item;
}

function createReplacementShopItem(previousItem) {
  const nextTier = Math.min(6, Math.max(getItemTier(previousItem), getItemTier(previousItem) + (Math.random() > 0.35 ? 1 : 0)));
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
      const directPackTemplate = packTwoLootItems.find((item) => !usedIds.has(item.id) && getItemTier(item) < 6);
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
    spawnEnemy();
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
  };
  delete state.hero.statPoints;
  state.hero.level = Math.max(1, Number(state.hero.level) || 1);
  state.hero.xp = Math.max(0, Number(state.hero.xp) || 0);
  state.hero.xpToNext = getXpForNextLevel(state.hero.level);
  state.wave = Number(saveData.wave) || 1;
  state.maxUnlockedLevel = Math.max(Number(saveData.maxUnlockedLevel) || 1, state.hero.level, state.wave || 1);
  state.wave = Math.max(1, Math.min(state.wave, state.maxUnlockedLevel));
  state.roadmapStart = getRoadmapBlockStart(state.wave);
  state.inventory = Array.isArray(saveData.inventory) ? saveData.inventory : [];
  migrateSavedGemsToInventory(Number(saveData.gems) || 0);
  state.gems = 0;
  state.equipped = Object.fromEntries(Object.entries(saveData.equipped || {}).map(([slot, item]) => [slot, normalizeSavedItem(item)]));
  state.shopStock = Array.isArray(saveData.shopStock) && saveData.shopStock.length > 0
    ? refreshShopStock(saveData.shopStock)
    : createInitialShopStock();
  state.activeEffects = restoreActiveEffects(saveData.activeEffects);
  state.killsSinceLoot = Number(saveData.killsSinceLoot) || 0;
  state.lastEnemyName = saveData.lastEnemyName || "";
  state.enemy = restoreEnemy(saveData.enemy);
  if (!state.enemy) spawnEnemy();
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
    stats: {
      vitality: 0,
      power: 0,
      haste: 0,
    },
  };
  state.enemy = null;
  state.wave = 1;
  state.maxUnlockedLevel = 1;
  state.roadmapStart = 1;
  state.inventory = [];
  state.equipped = {};
  state.shopStock = createInitialShopStock();
  state.craftingSlots = [null, null, null];
  state.activePanel = "shop";
  state.activeEffects = [];
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
  xpText: document.querySelector("#xpText"),
  xpBar: document.querySelector("#xpBar"),
  goldText: document.querySelector("#goldText"),
  pointsText: document.querySelector("#pointsText"),
  statsGrid: document.querySelector("#statsGrid"),
  enemyList: document.querySelector("#enemyList"),
  shopList: document.querySelector("#shopList"),
  shopHint: document.querySelector("#shopHint"),
  inventoryList: document.querySelector("#inventoryList"),
  inventoryCount: document.querySelector("#inventoryCount"),
  equipmentGrid: document.querySelector("#equipmentGrid"),
  craftingList: document.querySelector("#craftingList"),
  craftHint: document.querySelector("#craftHint"),
  craftButton: document.querySelector("#craftButton"),
  panelTabs: document.querySelectorAll("[data-panel-tab]"),
  panelViews: document.querySelectorAll("[data-panel-view]"),
  statusGrid: document.querySelector("#statusGrid"),
  statusHint: document.querySelector("#statusHint"),
  projectileLane: document.querySelector("#projectileLane"),
  deathOverlay: document.querySelector("#deathOverlay"),
  deathCountdown: document.querySelector("#deathCountdown"),
};

const slotLabels = {
  weapon: "Silah",
  armor: "Zırh",
  helmet: "Başlık",
  gloves: "Eldiven",
  ring: "Yüzük",
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getStageWidth() {
  return els.stage?.clientWidth || window.innerWidth || 980;
}

function getMobileCombatScale() {
  const stageWidth = getStageWidth();
  if (stageWidth >= 640) return 1;
  return clamp(stageWidth / 560, 0.52, 1);
}

function getEnemyPosition() {
  const stageWidth = getStageWidth();
  if (stageWidth >= 640) return enemyPosition;

  return {
    approachSpan: clamp(stageWidth * 0.42, 115, enemyPosition.approachSpan),
    contactOffset: -clamp(stageWidth * 0.16, 44, 82),
  };
}

function getEnemyAnimationName(now = performance.now()) {
  if (!state.enemy) return "idle";
  if (now < state.enemy.attackAnimUntil) return state.enemy.activeAttackAnim || "attack";
  return state.enemy.distance > 0 ? "run" : "idle";
}

function getEnemyGroundOffset(animName = getEnemyAnimationName()) {
  return state.enemy?.animations?.[animName]?.groundOffset ?? state.enemy?.groundOffset ?? 0;
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
  spawnEnemy();
  state.panelsDirty = true;
  queueSave("Karakter sıfırlandı");
  render();
});

els.craftButton.addEventListener("click", () => craftItemFromMaterials());

els.panelTabs.forEach((button) => {
  button.addEventListener("click", () => {
    state.activePanel = button.dataset.panelTab;
    renderPanelTabs();
  });
});

window.addEventListener("beforeunload", () => {
  flushSave();
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
  } catch {
    setSaveStatus("Kayıt hatası");
  }
}

function getItemBonus(key) {
  return Object.values(state.equipped).reduce((sum, item) => sum + (item[key] || 0), 0);
}

function getEffectBonus(key) {
  return state.activeEffects.reduce((sum, activeEffect) => sum + (activeEffect.effect?.[key] || 0), 0);
}

function getHeroDamage() {
  return state.hero.damage + getItemBonus("damage") + getEffectBonus("damage");
}

function getHeroMaxHealth() {
  return state.hero.maxHealth + getItemBonus("maxHealth") + getEffectBonus("maxHealth");
}

function getHeroAttackSpeed() {
  return state.hero.attackSpeed + getItemBonus("attackSpeed") + getEffectBonus("attackSpeed");
}

function getUpgradeCost(upgradeKey) {
  const upgrade = upgradeConfig[upgradeKey];
  const purchased = state.hero.stats[upgradeKey] || 0;
  return Math.round(upgrade.baseCost * Math.pow(upgrade.costGrowth, purchased));
}

function canEquipItem(item) {
  return state.hero.level >= getItemRequiredLevel(item);
}

function getItemIcon(item) {
  return itemCatalog.get(item.id)?.icon || item.icon || "assets/items/Item__00.png";
}

function getItemRequiredLevel(item) {
  return itemCatalog.get(item.id)?.requiredLevel || item.requiredLevel || 1;
}

function getItemTier(item) {
  return itemCatalog.get(item.id)?.tier || item.tier || 1;
}

function getItemTierConfig(item) {
  return tierConfig[getItemTier(item)] || tierConfig[1];
}

function getItemType(item) {
  return itemCatalog.get(item.id)?.type || item.type || "equipment";
}

function getItemEffect(item) {
  return itemCatalog.get(item.id)?.effect || item.effect || {};
}

function getItemDuration(item) {
  return itemCatalog.get(item.id)?.durationMs || item.durationMs || 0;
}

function getItemQuantity(item) {
  if (!Object.prototype.hasOwnProperty.call(item, "quantity")) return 1;
  const quantity = Number(item.quantity);
  return Number.isFinite(quantity) ? Math.max(0, quantity) : 1;
}

function applyTierStyle(element, item) {
  const tier = getItemTierConfig(item);
  element.style.setProperty("--tier-color", tier.color);
  element.dataset.tier = getItemTier(item);
}

function chooseLootTier(enemyLevel) {
  const scaledTier = Math.max(1, Math.ceil(enemyLevel / 3));
  const maxTier = enemyLevel >= 45 ? Math.min(6, scaledTier) : Math.min(5, scaledTier);
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

function spawnEnemy(forcedTemplate = null) {
  const options = enemies.length > 1 ? enemies.filter((enemy) => enemy.name !== state.lastEnemyName) : enemies;
  const template = forcedTemplate || options[Math.floor(Math.random() * options.length)];
  const level = state.wave;
  const maxHealth = Math.round(48 + level * 18 + Math.pow(level, 1.22) * 7);

  state.enemy = {
    ...template,
    level,
    maxHealth,
    health: maxHealth,
    damage: Math.round(4 + level * 1.9 + Math.pow(level, 1.08) * 0.4),
    attackSpeed: Math.min(0.95 + level * 0.018, 1.85),
    distance: 1,
    moveSpeed: Math.min(0.42 + level * 0.018, 0.72),
    xp: getEnemyXpReward(level),
    gold: Math.round(12 + level * 6),
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
  const safeEnemyLevel = Math.max(1, Number(enemyLevel) || 1);
  const safeHeroLevel = Math.max(1, Number(state.hero.level) || 1);
  const baseXp = Math.round(28 + safeEnemyLevel * 9 + Math.pow(safeEnemyLevel, 1.08) * 4);
  const levelGap = safeHeroLevel - safeEnemyLevel;

  if (levelGap <= 0) {
    const bonus = Math.min(Math.abs(levelGap) * 0.06, 0.3);
    return Math.round(baseXp * (1 + bonus));
  }

  const penalty = Math.min(levelGap * 0.12, 0.92);
  return Math.max(1, Math.round(baseXp * (1 - penalty)));
}

function setRoadmapBlock(start) {
  const safeStart = Math.max(1, Math.round(start));
  state.roadmapStart = safeStart <= 1 ? 1 : Math.floor(safeStart / 50) * 50;
  renderRoadmap();
}

function selectStageLevel(level) {
  const selectedLevel = Math.max(1, Math.round(level));
  if (selectedLevel > state.maxUnlockedLevel) {
    setSaveStatus(`Level ${selectedLevel} için XP gerekiyor`, 1600);
    return;
  }

  state.wave = selectedLevel;
  state.roadmapStart = getRoadmapBlockStart(state.wave);
  state.lastAttackAt = 0;
  state.lastEnemyAttackAt = 0;
  spawnEnemy();
  state.panelsDirty = true;
  setSaveStatus(`Level ${state.wave} seçildi`);
  queueSave("Level seçildi");
  render();
}

function testEnemy(enemyName) {
  const template = enemies.find((enemy) => enemy.name === enemyName);
  if (!template) return;

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
  if (state.heroDownUntil > 0 || state.enemy.distance <= 0) return;
  state.enemy.distance = Math.max(0, state.enemy.distance - state.enemy.moveSpeed * deltaSeconds);
}

function attackEnemy(now) {
  if (state.heroDownUntil > now) return;

  const interval = 1000 / getHeroAttackSpeed();
  if (now - state.lastAttackAt < interval) return;

  state.lastAttackAt = now;
  const damage = Math.round(getHeroDamage() * randomBetween(0.9, 1.15));
  state.enemy.health = Math.max(0, state.enemy.health - damage);
  fireArrow();
  flashEnemy();
  showDamageNumber(damage);
  queueSave("Savaş kaydediliyor");

  if (state.enemy.health <= 0) {
    defeatEnemy();
  }
}

function enemyAttackHero(now) {
  if (state.heroDownUntil > now || state.enemy.distance > 0) return;

  const interval = 1000 / state.enemy.attackSpeed;
  if (now - state.lastEnemyAttackAt < interval) return;

  state.lastEnemyAttackAt = now;
  state.hero.health = Math.max(0, state.hero.health - Math.round(state.enemy.damage * randomBetween(0.85, 1.2)));
  flashHero();
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
  rollLoot(defeated.level);
  levelUpIfNeeded();
  state.panelsDirty = true;
  spawnEnemy();
  queueSave("İlerleme kaydediliyor");
}

function getEnemyGoldReward(enemy) {
  const heroLevel = Math.max(1, Number(state.hero.level) || 1);
  const enemyLevel = Math.max(1, Number(enemy.level) || 1);
  const levelGap = Math.max(0, heroLevel - enemyLevel);
  if (levelGap <= 0) return enemy.gold;

  let modifier = 1;

  if (levelGap <= 4) modifier = 0.7;
  else if (levelGap <= 9) modifier = 0.45;
  else if (levelGap <= 19) modifier = 0.2;
  else modifier = 0.06;

  return Math.max(1, Math.round(enemy.gold * modifier));
}

function getLootLevelModifier(enemyLevel) {
  const heroLevel = Math.max(1, Number(state.hero.level) || 1);
  const levelGap = Math.max(0, heroLevel - enemyLevel);
  if (levelGap <= 0) return 1;
  if (levelGap <= 4) return 0.55;
  if (levelGap <= 9) return 0.25;
  if (levelGap <= 19) return 0.08;
  return 0.02;
}

function rollLoot(enemyLevel) {
  const levelModifier = getLootLevelModifier(enemyLevel);
  const dropChance = Math.min(0.035 + enemyLevel * 0.0015, 0.1) * levelModifier;
  const pityThreshold = Math.round(18 / levelModifier);
  const pityDrop = state.killsSinceLoot >= pityThreshold;
  if (!pityDrop && Math.random() > dropChance) return;

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
  queueSave("Ganimet kaydediliyor");
}

function downHero(now) {
  const xpPenalty = Math.min(state.hero.xp, Math.round(randomBetween(500, 700)));
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
  state.enemy.distance = 1;
  state.lastAttackAt = 0;
  state.lastEnemyAttackAt = 0;
  els.heroWrap.classList.remove("dead");
  els.deathOverlay.hidden = true;
  queueSave("Diriliş kaydediliyor");
}

function levelUpIfNeeded() {
  const previousLevel = state.hero.level;
  state.hero.xpToNext = getXpForNextLevel(state.hero.level);
  while (state.hero.xp >= state.hero.xpToNext) {
    state.hero.xp -= state.hero.xpToNext;
    state.hero.level += 1;
    state.hero.xpToNext = getXpForNextLevel(state.hero.level);
    state.maxUnlockedLevel = Math.max(state.maxUnlockedLevel, state.hero.level);
    state.panelsDirty = true;
  }

  if (state.hero.level > previousLevel) {
    state.wave = state.hero.level;
    state.maxUnlockedLevel = Math.max(state.maxUnlockedLevel, state.wave);
    state.roadmapStart = getRoadmapBlockStart(state.wave);
    state.lastAttackAt = 0;
    state.lastEnemyAttackAt = 0;
    setSaveStatus(`Level ${state.hero.level} açıldı`, 1600);
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

function buyItem(stockId) {
  const stockIndex = state.shopStock.findIndex((entry) => entry.stockId === stockId);
  const item = state.shopStock[stockIndex];
  if (!item || state.gold < item.cost) return;

  state.gold -= item.cost;
  const { stockId: _stockId, ...inventoryItem } = item;
  state.inventory.push({ ...inventoryItem, uid: crypto.randomUUID(), source: "shop" });
  state.shopStock[stockIndex] = createReplacementShopItem(item);
  state.panelsDirty = true;
  queueSave("Alisveris kaydediliyor");
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
  const item = removeInventoryItem(uid);
  if (!item) return;
  state.panelsDirty = true;
  setSaveStatus("Item yok edildi");
  queueSave("Item yok edildi");
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

function craftItemFromMaterials() {
  const slotItems = getCraftSlotItems();
  if (slotItems.some((item) => !item)) {
    setSaveStatus("3 slota parça sürükle");
    return;
  }

  const consumedTiers = consumeCraftSlots();
  const averageTier = consumedTiers.reduce((sum, tier) => sum + tier, 0) / consumedTiers.length;
  const craftedTier = Math.max(1, Math.min(6, Math.round(averageTier)));
  const item = createGeneratedEquipment(craftedTier, "crafted", 0);
  item.name = `Birleşik ${tierConfig[craftedTier].label} ${slotLabels[item.slot]}`;
  item.cost = 0;
  state.inventory.push({ ...item, uid: crypto.randomUUID(), source: "crafted" });
  state.panelsDirty = true;
  setSaveStatus(`${item.name} oluşturuldu`);
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

function fireArrow() {
  const arrow = document.createElement("span");
  arrow.className = "arrow";
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

function showDamageNumber(damage) {
  const popup = document.createElement("span");
  popup.className = "damage-popup";
  popup.textContent = `-${damage}`;
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

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
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

function getInventoryItemCount() {
  return state.inventory.reduce((total, item) => (
    total + (getItemType(item) === "material" ? getItemQuantity(item) : 1)
  ), 0);
}

function renderStats() {
  els.statsGrid.innerHTML = "";
  Object.entries(upgradeConfig).forEach(([key, upgrade]) => {
    const cost = getUpgradeCost(key);
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <div>
        <strong>${upgrade.label}: ${upgrade.value()}</strong>
        <span>${upgrade.description} - ${cost} altın</span>
      </div>
      <button type="button" aria-label="${upgrade.label} satın al" ${state.gold < cost ? "disabled" : ""}>Al</button>
    `;
    row.querySelector("button").addEventListener("click", () => buyUpgrade(key));
    els.statsGrid.append(row);
  });
}

function renderEnemyList() {
  els.enemyList.innerHTML = "";
  enemies.forEach((enemy) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "enemy-list-row";
    row.innerHTML = `
      <span>${enemy.name}</span>
      <small>${enemy.animations.attackAlt ? "2 saldırı" : "1 saldırı"} / tıkla test et</small>
    `;
    row.addEventListener("click", () => testEnemy(enemy.name));
    els.enemyList.append(row);
  });
}

function renderRoadmap() {
  if (!state.roadmapStart) state.roadmapStart = getRoadmapBlockStart(state.wave);
  const blockStart = state.roadmapStart;
  const blockEnd = blockStart === 1 ? 50 : blockStart + 50;
  els.roadmapRange.textContent = `${blockStart} - ${blockEnd}`;
  els.roadmapStatus.innerHTML = "";

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "road-nav";
  previousButton.textContent = "<";
  previousButton.disabled = blockStart <= 1;
  previousButton.addEventListener("click", () => setRoadmapBlock(blockStart - 50));

  const statusText = document.createElement("span");
  statusText.textContent = `Seçili ${state.wave} / Açık ${state.maxUnlockedLevel}`;

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
    const button = document.createElement("button");
    button.type = "button";
    button.className = `road-level${level === state.wave ? " current" : ""}${isLocked ? " locked" : ""}`;
    button.textContent = level;
    button.title = isLocked ? "Bu level için önce XP kasmalısın" : `Level ${level} seç`;
    button.dataset.locked = isLocked ? "true" : "false";
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
    ["Altın", state.gold],
    ["Savaş Leveli", state.wave],
    ["Açık Level", state.maxUnlockedLevel],
  ];

  els.statusHint.textContent = state.activeEffects.length > 0 ? `${state.activeEffects.length} iksir aktif` : "Hazır";
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
  state.shopStock.forEach((item) => {
    const row = document.createElement("div");
    row.className = "item";
    applyTierStyle(row, item);
    row.innerHTML = `
      <img class="item-icon" src="${getItemIcon(item)}" alt="" draggable="false" />
      <div>
        <strong>${item.name}</strong>
        <small>${itemBonusText(item)} - ${item.cost} altın</small>
      </div>
      <button type="button" ${state.gold < item.cost ? "disabled" : ""}>Al</button>
    `;
    row.querySelector("button").addEventListener("click", () => buyItem(item.stockId));
    els.shopList.append(row);
  });
}

function renderInventory() {
  els.inventoryList.innerHTML = "";
  els.inventoryCount.textContent = `${getInventoryItemCount()} item`;

  if (state.inventory.length === 0) {
    const empty = document.createElement("div");
    empty.className = "item empty-item";
    empty.innerHTML = "<div><strong>Çanta boş</strong><small>Nadir ganimet için düşman kes veya dükkandan item al.</small></div>";
    els.inventoryList.append(empty);
    return;
  }

  state.inventory.forEach((item) => {
    const itemType = getItemType(item);
    const isEquipment = itemType === "equipment";
    const isMaterial = itemType === "material";
    const isEquipped = isEquipment && state.equipped[item.slot]?.uid === item.uid;
    const levelLocked = !canEquipItem(item);
    const row = document.createElement("div");
    row.className = `item${isEquipped ? " equipped" : ""}${levelLocked ? " locked" : ""}`;
    row.draggable = true;
    row.dataset.uid = item.uid;
    applyTierStyle(row, item);
    const primaryText = itemType === "potion" ? "Ic" : isEquipped ? "Cikar" : levelLocked ? `Lv ${getItemRequiredLevel(item)}` : "Giy";
    const sourceText = isMaterial ? "Malzeme" : itemType === "potion" ? "Iksir" : isEquipped ? "Kusanildi" : item.source === "drop" ? `Ganimet - ${item.slot}` : item.slot;
    const itemName = item.name;
    const quantityBadge = isMaterial ? `<span class="item-quantity">${getItemQuantity(item)}x</span>` : "";
    const actionsHtml = isMaterial
      ? '<button type="button" data-action="craft">Ekle</button><button type="button" data-action="destroy">Yok Et</button>'
      : `<button type="button" data-action="primary" ${levelLocked && !isEquipped ? "disabled" : ""}>${primaryText}</button>
        ${isEquipped ? "" : '<button type="button" data-action="salvage">Parcala</button><button type="button" data-action="destroy">Yok Et</button>'}`;
    row.innerHTML = `
      ${quantityBadge}
      <img class="item-icon" src="${getItemIcon(item)}" alt="" draggable="false" />
      <div>
        <strong>${itemName}</strong>
        <small>${sourceText} - ${itemBonusText(item)}</small>
      </div>
      <div class="item-actions">
        ${actionsHtml}
      </div>
    `;
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
      if (isEquipped) {
        unequipItem(item.slot);
        return;
      }
      if (itemType === "potion") {
        usePotion(item.uid);
        return;
      }
      equipItem(item.uid);
    });
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

function renderEquipment() {
  els.equipmentGrid.innerHTML = "";
  Object.entries(slotLabels).forEach(([slot, label]) => {
    const equipped = state.equipped[slot];
    const slotEl = document.createElement("div");
    slotEl.className = `equip-slot${equipped ? " filled" : ""}`;
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
    els.equipmentGrid.append(slotEl);
  });
}

function renderPanelTabs() {
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
  renderEnemyList();
  renderStatusPanel();
  renderShop();
  renderInventory();
  renderCrafting();
  renderEquipment();
  state.panelsDirty = false;
}

function render() {
  const maxHealth = getHeroMaxHealth();
  state.hero.health = Math.min(state.hero.health, maxHealth);

  els.heroLevel.textContent = `Seviye ${state.hero.level}`;
  els.healthText.textContent = `${Math.round(state.hero.health)} / ${maxHealth}`;
  els.healthBar.style.width = `${(state.hero.health / maxHealth) * 100}%`;
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
  els.xpText.textContent = `${state.hero.xp} / ${state.hero.xpToNext}`;
  els.xpBar.style.width = `${(state.hero.xp / state.hero.xpToNext) * 100}%`;
  els.goldText.textContent = state.gold;
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

function loop(now) {
  if (!state.session.active) {
    requestAnimationFrame(loop);
    return;
  }

  const deltaSeconds = state.lastFrameAt ? Math.min((now - state.lastFrameAt) / 1000, 0.08) : 0;
  state.lastFrameAt = now;

  updateDeath(now);
  updateActiveEffects();
  approachEnemy(deltaSeconds);
  attackEnemy(now);
  enemyAttackHero(now);
  if (now - state.session.lastAutoSaveAt > 5000) {
    state.session.lastAutoSaveAt = now;
    queueSave("Otomatik kayıt");
  }
  render();
  renderEnemyFrame(now);
  requestAnimationFrame(loop);
}

showAuthMessage("Giriş yap veya kayıt ol.");
requestAnimationFrame(loop);




