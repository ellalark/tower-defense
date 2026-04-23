export const splash = {
  id: 'splash',
  name: 'Mortar',
  archetype: 'splash',
  placementCost: 200,
  damageType: 'thermal',
  splashRadius: 60,
  art: { atlas: 'towers', frame: 'splash' },
  levels: [
    { damage: 12, range: 180, cooldownTicks: 90 },
    { damage: 20, range: 180, cooldownTicks: 90, upgradeCost: 400 },
    { damage: 30, range: 180, cooldownTicks: 90, upgradeCost: 800 },
  ],
  fire(world, self, target) {
    for (const enemy of world.enemies) {
      if (Math.hypot(enemy.x - target.x, enemy.y - target.y) <= self.def.splashRadius) {
        enemy.applyDamage(self.damage, self.def.damageType, world);
      }
    }
  },
  ability: {
    cooldownTicks: 720,
    execute(_rng, world, self) {
      for (const enemy of world.enemies) {
        if (Math.hypot(enemy.x - self.x, enemy.y - self.y) <= self.range) {
          enemy.applyDamage(self.damage * 1.5, self.def.damageType, world);
        }
      }
    },
  },
};
