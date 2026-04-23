import { selectTarget } from '../../systems/targeting.js';

export const singleTargetDps = {
  id: 'singleTargetDps',
  name: 'Sniper',
  archetype: 'singleTargetDps',
  placementCost: 150,
  damageType: 'kinetic',
  art: { atlas: 'towers', frame: 'singleTargetDps' },
  levels: [
    { damage: 25, range: 250, cooldownTicks: 60 },
    { damage: 40, range: 250, cooldownTicks: 50, upgradeCost: 300 },
    { damage: 60, range: 250, cooldownTicks: 40, upgradeCost: 600 },
  ],
  fire(world, self, target) {
    target.applyDamage(self.damage, self.def.damageType, world);
  },
  ability: {
    cooldownTicks: 600,
    execute(_rng, world, self) {
      const target = selectTarget(self, world.enemies, self.targetingMode, world);
      if (target == null) return;
      target.applyDamage(self.damage * 3, self.def.damageType, world);
    },
  },
};
