import { BASE_HP_DEFAULT } from '../config/constants.js';

function defaultState() {
  return {
    currentWave: 0,
    currency: 0,
    baseHp: BASE_HP_DEFAULT,
    runSeed: null,
    towers: [],
    enemies: [],
    projectiles: [],
    paused: false,
    speedMultiplier: 1,
    uiMode: 'menu',
    tutorialStep: null,
    manualTargetId: null,
  };
}

let state = defaultState();
const listeners = [];

export function getState() {
  return state;
}

function fire(newState, prevState) {
  const snapshot = [...listeners];
  for (const entry of snapshot) {
    try {
      entry.fn(newState, prevState);
    } catch (err) {
      console.error(err);
    }
  }
}

export function setState(partial) {
  const prev = state;
  state = { ...state, ...partial };
  fire(state, prev);
}

export function subscribe(listener) {
  const entry = { fn: listener };
  listeners.push(entry);
  let removed = false;
  return () => {
    if (removed) return;
    removed = true;
    const idx = listeners.indexOf(entry);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export function reset() {
  const prev = state;
  state = defaultState();
  fire(state, prev);
}
