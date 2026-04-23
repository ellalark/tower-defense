import { SlowEffect } from '../../entities/logic/StatusEffect.js';

export const slow = {
  id: 'slow',
  name: 'Cryo Tower',
  archetype: 'slow',
  placementCost: 125,
  damageType: 'cryo',
  slowFactor: 0.5,
  slowDurationTicks: 120,
  art: { atlas: 'towers', frame: 'slow' },
  levels: [
    { damage: 5, range: 200, cooldownTicks: 60 },
    { damage: 8, range: 200, cooldownTicks: 60, upgradeCost: 250 },
    { damage: 12, range: 200, cooldownTicks: 60, upgradeCost: 500 },
  ],
  fire(world, self, target) {
    target.applyDamage(self.damage, self.def.damageType, world);
    target.effects.push(
      new SlowEffect({ durationTicks: self.def.slowDurationTicks, factor: self.def.slowFactor }),
    );
  },
  ability: {
    cooldownTicks: 900,
    execute(_rng, world, self) {
      for (const enemy of world.enemies) {
        if (Math.hypot(enemy.x - self.x, enemy.y - self.y) <= self.range) {
          enemy.effects.push(
            new SlowEffect({
              durationTicks: self.def.slowDurationTicks * 2,
              factor: self.def.slowFactor * 0.5,
            }),
          );
        }
      }
    },
  },
};
