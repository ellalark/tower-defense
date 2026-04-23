import { TICK_MS } from '../config/constants.js';

// TICK_MS = 1000/60 is irrational in binary; repeated subtraction drifts by a
// few ulps, so pad the threshold and clamp post-flush to keep tick counts exact.
const EPSILON = TICK_MS * Number.EPSILON * 64;

export function createLoop({ onTick }) {
  let accumulator = 0;

  return {
    advance(deltaMs, speedMultiplier) {
      accumulator += deltaMs * speedMultiplier;
      let ticks = 0;
      while (accumulator + EPSILON >= TICK_MS) {
        onTick();
        accumulator -= TICK_MS;
        ticks++;
      }
      if (accumulator < 0) accumulator = 0;
      return { ticks, alpha: accumulator / TICK_MS };
    },

    reset() {
      accumulator = 0;
    },
  };
}
