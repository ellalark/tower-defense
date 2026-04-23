export const economy = {
  id: 'economy',
  name: 'Gold Mine',
  archetype: 'economy',
  placementCost: 200,
  damageType: 'kinetic',
  earnPerActivation: 100,
  art: { atlas: 'towers', frame: 'economy' },
  levels: [
    { damage: 2, range: 120, cooldownTicks: 120 },
    { damage: 3, range: 120, cooldownTicks: 120, upgradeCost: 400 },
    { damage: 5, range: 120, cooldownTicks: 120, upgradeCost: 800 },
  ],
  fire(world, self, target) {
    target.applyDamage(self.damage, self.def.damageType, world);
  },
  ability: {
    cooldownTicks: 1800,
    execute(_rng, _world, self) {
      self.pendingEarn = (self.pendingEarn ?? 0) + self.def.earnPerActivation;
    },
  },
};
