export const splitter = {
  id: 'splitter',
  archetype: 'splitter',
  name: 'Splitter',
  hp: 20,
  speed: 0.5,
  armor: 0,
  flags: { flying: false, stealth: false, shielded: false },
  baseDamage: 2,
  bountyOnKill: 8,
  spawnCost: 3,
  art: { atlas: 'enemies', frame: 'splitter' },
  splitsInto: ['grunt', 'grunt', 'grunt'],
};
