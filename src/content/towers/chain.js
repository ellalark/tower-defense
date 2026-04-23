export const chain = {
  id: 'chain',
  name: 'Tesla',
  archetype: 'chain',
  placementCost: 175,
  damageType: 'energy',
  chainCount: 2,
  chainRange: 80,
  art: { atlas: 'towers', frame: 'chain' },
  levels: [
    { damage: 10, range: 220, cooldownTicks: 75 },
    { damage: 18, range: 220, cooldownTicks: 75, upgradeCost: 350 },
    { damage: 28, range: 220, cooldownTicks: 75, upgradeCost: 700 },
  ],
  fire(world, self, target) {
    const { chainCount, chainRange, damageType } = self.def;
    const hit = new Set();
    hit.add(target);
    target.applyDamage(self.damage, damageType, world);

    let prev = target;
    for (let i = 0; i < chainCount; i++) {
      let next = null;
      let bestDist = Infinity;
      for (const enemy of world.enemies) {
        if (hit.has(enemy)) continue;
        const d = Math.hypot(enemy.x - prev.x, enemy.y - prev.y);
        if (d <= chainRange && d < bestDist) {
          bestDist = d;
          next = enemy;
        }
      }
      if (next == null) break;
      hit.add(next);
      next.applyDamage(self.damage, damageType, world);
      prev = next;
    }
  },
  ability: {
    cooldownTicks: 540,
    execute(_rng, world, self) {
      const { chainRange, damageType } = self.def;
      const jumps = self.def.chainCount * 3;

      let nearest = null;
      let nearestDist = Infinity;
      for (const enemy of world.enemies) {
        const d = Math.hypot(enemy.x - self.x, enemy.y - self.y);
        if (d <= self.range && d < nearestDist) {
          nearestDist = d;
          nearest = enemy;
        }
      }
      if (nearest == null) return;

      const hit = new Set();
      hit.add(nearest);
      nearest.applyDamage(self.damage, damageType, world);

      let prev = nearest;
      for (let i = 0; i < jumps; i++) {
        let next = null;
        let bestDist = Infinity;
        for (const enemy of world.enemies) {
          if (hit.has(enemy)) continue;
          const d = Math.hypot(enemy.x - prev.x, enemy.y - prev.y);
          if (d <= chainRange && d < bestDist) {
            bestDist = d;
            next = enemy;
          }
        }
        if (next == null) break;
        hit.add(next);
        next.applyDamage(self.damage, damageType, world);
        prev = next;
      }
    },
  },
};
