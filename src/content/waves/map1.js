export const map1Waves = {
  1: {
    entries: [{ enemyId: 'grunt', count: 8, spacingTicks: 30, delayTicks: 0 }],
    meta: { waveNumber: 1, isBoss: false, isFinal: false },
  },
  2: {
    entries: [
      { enemyId: 'grunt', count: 10, spacingTicks: 25, delayTicks: 0 },
      { enemyId: 'fast', count: 4, spacingTicks: 20, delayTicks: 180 },
    ],
    meta: { waveNumber: 2, isBoss: false, isFinal: false },
  },
  3: {
    entries: [
      { enemyId: 'grunt', count: 12, spacingTicks: 25, delayTicks: 0 },
      { enemyId: 'fast', count: 6, spacingTicks: 18, delayTicks: 150 },
      { enemyId: 'tank', count: 1, spacingTicks: 0, delayTicks: 450 },
    ],
    meta: { waveNumber: 3, isBoss: false, isFinal: false },
  },
  10: {
    entries: [{ enemyId: 'boss', count: 1, spacingTicks: 0, delayTicks: 0 }],
    meta: { waveNumber: 10, isBoss: true, isFinal: false },
  },
  20: {
    entries: [{ enemyId: 'boss', count: 1, spacingTicks: 0, delayTicks: 0 }],
    meta: { waveNumber: 20, isBoss: true, isFinal: false },
  },
  30: {
    entries: [{ enemyId: 'finalBossMap1', count: 1, spacingTicks: 0, delayTicks: 0 }],
    meta: { waveNumber: 30, isBoss: true, isFinal: true },
  },
};

export default map1Waves;
