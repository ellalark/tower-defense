export const support = {
  id: 'support',
  name: 'Command Post',
  archetype: 'support',
  placementCost: 250,
  damageType: 'energy',
  buffRadius: 150,
  buffStrength: 0.3,
  buffDurationTicks: 300,
  art: { atlas: 'towers', frame: 'support' },
  levels: [
    { damage: 3, range: 150, cooldownTicks: 120 },
    { damage: 5, range: 150, cooldownTicks: 120, upgradeCost: 500 },
    { damage: 8, range: 150, cooldownTicks: 120, upgradeCost: 1000 },
  ],
  fire(world, self, target) {
    target.applyDamage(self.damage, self.def.damageType, world);
  },
  ability: {
    cooldownTicks: 1200,
    execute(_rng, _world, self) {
      self.buffPulseRemaining = self.def.buffDurationTicks;
      self.buffPulseStrength = self.def.buffStrength;
    },
  },
};
