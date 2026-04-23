import { getState, setState } from '../state/store.js';

const WAVE_BONUS_BASE = 25;
const WAVE_BONUS_PER_WAVE = 5;

export function earn(_source, amount) {
  setState({ currency: getState().currency + amount });
}

export function spend(amount) {
  const { currency } = getState();
  if (amount > currency) return false;
  setState({ currency: currency - amount });
  return true;
}

export function applyWaveBonus(waveNumber) {
  const bonus = WAVE_BONUS_BASE + waveNumber * WAVE_BONUS_PER_WAVE;
  earn('waveBonus', bonus);
  return bonus;
}

export function tickPassive(towers) {
  let total = 0;
  for (const tower of towers) {
    if (tower.pendingEarn > 0) {
      total += tower.pendingEarn;
      tower.pendingEarn = 0;
    }
  }
  if (total > 0) earn('passive', total);
  return total;
}
