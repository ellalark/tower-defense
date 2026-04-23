import { describe, expect, it } from 'vitest';
import { computeScore, SCORING_WEIGHTS } from '../../../src/systems/scoring.js';

describe('wave monotonicity', () => {
  it('more waves yields higher score, holding other inputs constant', () => {
    const base = { mapDifficulty: 'easy', kills: 20, bossKills: 1 };
    expect(computeScore({ ...base, waveReached: 20 })).toBeGreaterThan(
      computeScore({ ...base, waveReached: 10 }),
    );
  });
});

describe('kill monotonicity', () => {
  it('more kills yields higher score, holding other inputs constant', () => {
    const base = { waveReached: 5, mapDifficulty: 'hard', bossKills: 0 };
    expect(computeScore({ ...base, kills: 100 })).toBeGreaterThan(
      computeScore({ ...base, kills: 50 }),
    );
  });
});

describe('boss-kill bonus', () => {
  it('bossKills=3 yields higher score than bossKills=0 and delta matches formula', () => {
    const base = { waveReached: 5, mapDifficulty: 'medium', kills: 30 };
    const withBoss = computeScore({ ...base, bossKills: 3 });
    const noBoss = computeScore({ ...base, bossKills: 0 });
    expect(withBoss).toBeGreaterThan(noBoss);
    const multiplier = SCORING_WEIGHTS.DIFFICULTY_MULTIPLIERS.medium;
    const expectedDelta = Math.round(3 * SCORING_WEIGHTS.BOSS_BONUS * multiplier);
    expect(withBoss - noBoss).toBe(expectedDelta);
  });
});

describe('difficulty multiplier effect', () => {
  it('hardest yields strictly higher score than easy for identical inputs', () => {
    const base = { waveReached: 10, kills: 50, bossKills: 2 };
    const easyScore = computeScore({ ...base, mapDifficulty: 'easy' });
    const hardestScore = computeScore({ ...base, mapDifficulty: 'hardest' });
    expect(hardestScore).toBeGreaterThan(easyScore);
    expect(hardestScore / easyScore).toBeCloseTo(2.0, 5);
  });
});

describe('exact formula spot-check', () => {
  it('waveReached=10, easy, kills=50, bossKills=1 → 1550', () => {
    expect(computeScore({ waveReached: 10, mapDifficulty: 'easy', kills: 50, bossKills: 1 })).toBe(
      1550,
    );
  });
});

describe('all difficulty multipliers', () => {
  it('each difficulty key produces score matching round(raw * multiplier)', () => {
    const waveReached = 7;
    const kills = 33;
    const bossKills = 2;
    const raw =
      waveReached * SCORING_WEIGHTS.WAVE_POINTS +
      kills * SCORING_WEIGHTS.KILL_POINTS +
      bossKills * SCORING_WEIGHTS.BOSS_BONUS;

    for (const [difficulty, multiplier] of Object.entries(SCORING_WEIGHTS.DIFFICULTY_MULTIPLIERS)) {
      expect(computeScore({ waveReached, mapDifficulty: difficulty, kills, bossKills })).toBe(
        Math.round(raw * multiplier),
      );
    }
  });
});

describe('integer result', () => {
  it('returns an integer even when raw * multiplier is not whole', () => {
    const result = computeScore({
      waveReached: 1,
      mapDifficulty: 'medium',
      kills: 0,
      bossKills: 0,
    });
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('zero inputs', () => {
  it('returns 0 when all inputs are zero', () => {
    expect(computeScore({ waveReached: 0, mapDifficulty: 'easy', kills: 0, bossKills: 0 })).toBe(0);
  });
});
