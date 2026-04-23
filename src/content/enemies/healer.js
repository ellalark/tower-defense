export const healer = {
  id: 'healer',
  archetype: 'healer',
  name: 'Healer',
  hp: 25,
  speed: 0.4,
  armor: 1,
  flags: { flying: false, stealth: false, shielded: false },
  baseDamage: 1,
  bountyOnKill: 10,
  art: { atlas: 'enemies', frame: 'healer' },
  healsRadius: 100,
  healsPerTick: 1,
};
