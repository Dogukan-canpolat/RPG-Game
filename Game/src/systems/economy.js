export function getXpForNextLevel(level) {
  const safeLevel = Math.max(1, Number(level) || 1);
  return Math.round(85 + Math.pow(safeLevel, 1.62) * 58 + safeLevel * 22);
}

export function getEnemyXpReward(enemyLevel, heroLevel) {
  const safeEnemyLevel = Math.max(1, Number(enemyLevel) || 1);
  const safeHeroLevel = Math.max(1, Number(heroLevel) || 1);
  const baseXp = Math.round(28 + safeEnemyLevel * 9 + Math.pow(safeEnemyLevel, 1.08) * 4);
  const levelGap = safeHeroLevel - safeEnemyLevel;

  if (levelGap <= 0) {
    const bonus = Math.min(Math.abs(levelGap) * 0.06, 0.3);
    return Math.round(baseXp * (1 + bonus));
  }

  const penalty = Math.min(levelGap * 0.12, 0.92);
  return Math.max(1, Math.round(baseXp * (1 - penalty)));
}

export function getEnemyGoldReward(enemy, heroLevel) {
  const safeHeroLevel = Math.max(1, Number(heroLevel) || 1);
  const enemyLevel = Math.max(1, Number(enemy.level) || 1);
  const levelGap = Math.max(0, safeHeroLevel - enemyLevel);
  if (levelGap <= 0) return enemy.gold;

  let modifier = 1;

  if (levelGap <= 4) modifier = 0.7;
  else if (levelGap <= 9) modifier = 0.45;
  else if (levelGap <= 19) modifier = 0.2;
  else modifier = 0.06;

  return Math.max(1, Math.round(enemy.gold * modifier));
}

export function getLootLevelModifier(enemyLevel, heroLevel) {
  const safeHeroLevel = Math.max(1, Number(heroLevel) || 1);
  const safeEnemyLevel = Math.max(1, Number(enemyLevel) || 1);
  const levelGap = Math.max(0, safeHeroLevel - safeEnemyLevel);
  if (levelGap <= 0) return 1;
  if (levelGap <= 4) return 0.55;
  if (levelGap <= 9) return 0.25;
  if (levelGap <= 19) return 0.08;
  return 0.02;
}

export function getDeathXpPenalty(heroLevel, stageLevel) {
  const safeHeroLevel = Math.max(1, Number(heroLevel) || 1);
  const safeStageLevel = Math.max(1, Number(stageLevel) || 1);
  const levelGap = Math.max(0, safeHeroLevel - safeStageLevel);
  let modifier = 1;

  if (levelGap <= 0) modifier = 1;
  else if (levelGap <= 4) modifier = 0.75;
  else if (levelGap <= 9) modifier = 0.5;
  else if (levelGap <= 19) modifier = 0.25;
  else modifier = 0.1;

  return Math.round((500 + Math.random() * 200) * modifier);
}

export function getShopRefreshCost(heroLevel, waveLevel) {
  const safeHeroLevel = Math.max(1, Number(heroLevel) || 1);
  const safeWaveLevel = Math.max(1, Number(waveLevel) || 1);
  const levelPressure = Math.max(safeHeroLevel, safeWaveLevel) - 1;
  return Math.round(180 + levelPressure * 85 + Math.max(0, safeWaveLevel - 1) * 35);
}

export function getUpgradeCost(upgrade, currentLevel) {
  return Math.round(upgrade.baseCost * Math.pow(upgrade.costGrowth, currentLevel));
}
