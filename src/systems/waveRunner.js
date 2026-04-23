export function createWaveRunner({ bus, waveSource, startWave = 1 }) {
  let waveNumber = startWave;
  let tickInWave = 0;
  let currentWave = null;

  function loadWave() {
    currentWave = waveSource(waveNumber);
  }

  function waveLastTick() {
    return currentWave.entries.reduce((max, entry) => {
      const last = entry.delayTicks + (entry.count - 1) * entry.spacingTicks;
      return Math.max(max, last);
    }, 0);
  }

  function tick() {
    if (!currentWave) loadWave();

    for (const entry of currentWave.entries) {
      for (let k = 0; k < entry.count; k++) {
        if (entry.delayTicks + k * entry.spacingTicks === tickInWave) {
          bus.emit('enemy:spawn', {
            enemyId: entry.enemyId,
            hpMul: entry.hpMul ?? 1,
            dmgMul: entry.dmgMul ?? 1,
            waveNumber,
            isBoss: currentWave.meta.isBoss,
            isFinal: currentWave.meta.isFinal,
          });
        }
      }
    }

    if (tickInWave >= waveLastTick()) {
      waveNumber++;
      tickInWave = 0;
      currentWave = null;
    } else {
      tickInWave++;
    }
  }

  function reset() {
    waveNumber = startWave;
    tickInWave = 0;
    currentWave = null;
  }

  function getState() {
    return { waveNumber, tickInWave };
  }

  return { tick, reset, getState };
}
