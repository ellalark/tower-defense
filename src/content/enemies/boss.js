export const boss = {
  id: 'boss',
  archetype: 'boss',
  name: 'Boss',
  hp: 300,
  speed: 0.3,
  armor: 3,
  flags: { flying: false, stealth: false, shielded: false },
  baseDamage: 20,
  bountyOnKill: 50,
  art: { atlas: 'enemies', frame: 'boss' },
  boss: true,
};
