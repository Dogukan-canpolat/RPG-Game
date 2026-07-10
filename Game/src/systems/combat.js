export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export function getStageWidth(stageElement) {
  return stageElement?.clientWidth || window.innerWidth || 980;
}

export function getMobileCombatScale(stageWidth) {
  if (stageWidth >= 640) return 1;
  return clamp(stageWidth / 560, 0.52, 1);
}

export function getEnemyPosition(stageWidth, enemyPosition) {
  if (stageWidth >= 640) {
    return {
      approachSpan: clamp(stageWidth * 0.36, 250, enemyPosition.approachSpan),
      contactOffset: -clamp(stageWidth * 0.3, 180, Math.abs(enemyPosition.contactOffset)),
    };
  }

  return {
    approachSpan: clamp(stageWidth * 0.42, 115, enemyPosition.approachSpan),
    contactOffset: -clamp(stageWidth * 0.16, 44, 82),
  };
}

export function getEnemyAnimationName(state, now = performance.now()) {
  if (!state.enemy) return "idle";
  if (now < state.enemy.attackAnimUntil) return state.enemy.activeAttackAnim || "attack";
  return state.enemy.distance > 0 ? "run" : "idle";
}

export function getEnemyGroundOffset(state, animName = getEnemyAnimationName(state)) {
  return state.enemy?.animations?.[animName]?.groundOffset ?? state.enemy?.groundOffset ?? 0;
}
