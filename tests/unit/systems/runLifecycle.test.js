import { beforeEach, describe, expect, it } from 'vitest';
import { BASE_HP_DEFAULT, STARTING_BUDGET_DEFAULT } from '../../../src/config/constants.js';
import { createSave } from '../../../src/save/save.js';
import { getState, reset, setState } from '../../../src/state/store.js';
import { createRunLifecycle } from '../../../src/systems/runLifecycle.js';

function makeMemoryAdapter(initial = null) {
  let blob = initial ? structuredClone(initial) : null;
  return {
    read: () => (blob === null ? null : structuredClone(blob)),
    write: (obj) => {
      blob = structuredClone(obj);
    },
    clear: () => {
      blob = null;
    },
  };
}

const testMap = {
  id: 'testmap',
  difficulty: 'easy',
  startingBudget: 150,
  unlocksMapId: 'nextmap',
  unlocksTowerId: 'newTower',
};

let save;
let lifecycle;

beforeEach(() => {
  reset();
  save = createSave(makeMemoryAdapter());
  lifecycle = createRunLifecycle(save);
});

describe('startRun', () => {
  it('stores explicit seed in runSeed and returns it', () => {
    const { seed } = lifecycle.startRun({ map: testMap, seed: 42 });
    expect(seed).toBe(42);
    expect(getState().runSeed).toBe(42);
  });

  it('generates a non-null seed when none provided', () => {
    const { seed } = lifecycle.startRun({ map: testMap });
    expect(seed).not.toBeNull();
    expect(typeof seed).toBe('number');
    expect(getState().runSeed).toBe(seed);
  });

  it('grants map.startingBudget when defined', () => {
    lifecycle.startRun({ map: testMap });
    expect(getState().currency).toBe(150);
  });

  it('falls back to STARTING_BUDGET_DEFAULT when map has no startingBudget', () => {
    const mapNobudget = { ...testMap, startingBudget: undefined };
    lifecycle.startRun({ map: mapNobudget });
    expect(getState().currency).toBe(STARTING_BUDGET_DEFAULT);
  });

  it('sets uiMode to prep', () => {
    lifecycle.startRun({ map: testMap });
    expect(getState().uiMode).toBe('prep');
  });

  it('resets prior run state before setting new values', () => {
    setState({ currentWave: 10, towers: [{ id: 1 }], enemies: [{ id: 2 }] });
    lifecycle.startRun({ map: testMap, seed: 99 });
    const state = getState();
    expect(state.currentWave).toBe(0);
    expect(state.towers).toEqual([]);
    expect(state.enemies).toEqual([]);
    expect(state.runSeed).toBe(99);
  });

  it('uses map.baseHp when defined', () => {
    const mapWithHp = { ...testMap, baseHp: 250 };
    lifecycle.startRun({ map: mapWithHp });
    expect(getState().baseHp).toBe(250);
  });

  it('falls back to BASE_HP_DEFAULT when map has no baseHp', () => {
    lifecycle.startRun({ map: testMap });
    expect(getState().baseHp).toBe(BASE_HP_DEFAULT);
  });
});

describe('endRun', () => {
  it('losing run: records PB and does not unlock maps or towers', () => {
    lifecycle.startRun({ map: testMap, seed: 1 });
    const result = lifecycle.endRun({
      map: testMap,
      outcome: { finalBossDefeated: false, waveReached: 15, kills: 80, bossKills: 1 },
    });
    const saved = save.load();
    expect(saved.personalBests.testmap.length).toBe(1);
    expect(saved.unlockedMaps).not.toContain('nextmap');
    expect(saved.unlockedTowers).not.toContain('newTower');
    expect(result.unlocked).toEqual({ mapId: null, towerId: null });
  });

  it('winning run: records PB and adds unlocksMapId and unlocksTowerId', () => {
    lifecycle.startRun({ map: testMap, seed: 2 });
    const result = lifecycle.endRun({
      map: testMap,
      outcome: { finalBossDefeated: true, waveReached: 30, kills: 200, bossKills: 3 },
    });
    const saved = save.load();
    expect(saved.personalBests.testmap.length).toBe(1);
    expect(saved.unlockedMaps).toContain('nextmap');
    expect(saved.unlockedTowers).toContain('newTower');
    expect(result.unlocked).toEqual({ mapId: 'nextmap', towerId: 'newTower' });
  });

  it('winning run with already-unlocked items: no duplicates, unlocked fields are null', () => {
    save.save({
      unlockedMaps: ['map1', 'nextmap'],
      unlockedTowers: ['singleTargetDps', 'newTower'],
    });
    lifecycle.startRun({ map: testMap, seed: 3 });
    const result = lifecycle.endRun({
      map: testMap,
      outcome: { finalBossDefeated: true, waveReached: 30, kills: 100, bossKills: 1 },
    });
    const saved = save.load();
    expect(saved.unlockedMaps.filter((m) => m === 'nextmap').length).toBe(1);
    expect(saved.unlockedTowers.filter((t) => t === 'newTower').length).toBe(1);
    expect(result.unlocked).toEqual({ mapId: null, towerId: null });
  });

  it('winning run with null unlocksMapId/unlocksTowerId: no unlock changes, PB still recorded', () => {
    const finalMap = { ...testMap, unlocksMapId: null, unlocksTowerId: null };
    lifecycle.startRun({ map: finalMap, seed: 4 });
    const result = lifecycle.endRun({
      map: finalMap,
      outcome: { finalBossDefeated: true, waveReached: 30, kills: 200, bossKills: 3 },
    });
    const saved = save.load();
    expect(saved.personalBests.testmap.length).toBe(1);
    expect(result.unlocked).toEqual({ mapId: null, towerId: null });
  });

  it('PB entry carries the run seed', () => {
    lifecycle.startRun({ map: testMap, seed: 777 });
    lifecycle.endRun({
      map: testMap,
      outcome: { finalBossDefeated: false, waveReached: 10, kills: 50, bossKills: 0 },
    });
    const saved = save.load();
    expect(saved.personalBests.testmap[0].seed).toBe(777);
  });

  it('return value includes score and finalBossDefeated', () => {
    lifecycle.startRun({ map: testMap, seed: 5 });
    const result = lifecycle.endRun({
      map: testMap,
      outcome: { finalBossDefeated: false, waveReached: 5, kills: 10, bossKills: 0 },
    });
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThan(0);
    expect(result.finalBossDefeated).toBe(false);
  });
});
