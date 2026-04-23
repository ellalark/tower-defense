function inRange(tower, enemy) {
  return Math.hypot(enemy.x - tower.x, enemy.y - tower.y) <= tower.range;
}

export function selectTarget(tower, enemies, mode, world) {
  if (mode === 'manual') {
    if (!world || world.manualTargetId == null) return null;
    for (const enemy of enemies) {
      if (enemy.id === world.manualTargetId && inRange(tower, enemy)) return enemy;
    }
    return null;
  }

  let best = null;

  for (const enemy of enemies) {
    if (!inRange(tower, enemy)) continue;

    if (best === null) {
      best = enemy;
      continue;
    }

    if (mode === 'first') {
      if (enemy.distanceTravelled > best.distanceTravelled) best = enemy;
    } else if (mode === 'last') {
      if (enemy.distanceTravelled < best.distanceTravelled) best = enemy;
    } else if (mode === 'strongest') {
      if (enemy.hp > best.hp) best = enemy;
    } else if (mode === 'closest') {
      if (
        Math.hypot(enemy.x - tower.x, enemy.y - tower.y) <
        Math.hypot(best.x - tower.x, best.y - tower.y)
      )
        best = enemy;
    } else {
      throw new Error(`unknown targeting mode: ${mode}`);
    }
  }

  return best;
}
