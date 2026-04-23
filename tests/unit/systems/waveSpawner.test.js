import { describe, expect, it } from 'vitest';
import { createSeededRng } from '../../../src/rng/seeded.js';
import { enemies } from '../../../src/content/enemies/index.js';
import { generate, budget, hpMul, dmgMul } from '../../../src/systems/waveSpawner.js';
import { validateWaveDefinition } from '../../../src/content/waves/_shape.js';

const allEnemies = { ...enemies };

function makeRng(seed) {
  return createSeededRng(seed);
}

describe('waveSpawner — curve properties', () => {
  it('budget grows with wave number', () => {
    expect(budget(10, 1)).toBeGreaterThan(budget(1, 1));
  });

  it('hpMul grows with wave number', () => {
    expect(hpMul(20, 1)).toBeGreaterThan(hpMul(1, 1));
  });

  it('budget grows with difficulty', () => {
    expect(budget(5, 5)).toBeGreaterThan(budget(5, 1));
  });
});

describe('waveSpawner — determinism', () => {
  it('same seed wave 1 diff 1 produces identical output', () => {
    const a = generate(1, 1, makeRng(42));
    const b = generate(1, 1, makeRng(42));
    expect(a).toEqual(b);
  });

  it('same seed wave 50 diff 3 produces identical output', () => {
    const a = generate(50, 3, makeRng(999));
    const b = generate(50, 3, makeRng(999));
    expect(a).toEqual(b);
  });

  it('same seed wave 100 diff 5 produces identical output', () => {
    const a = generate(100, 5, makeRng(12345));
    const b = generate(100, 5, makeRng(12345));
    expect(a).toEqual(b);
  });

  it('different seeds produce different outputs', () => {
    const a = generate(10, 2, makeRng(1));
    const b = generate(10, 2, makeRng(2));
    expect(a).not.toEqual(b);
  });
});

describe('waveSpawner — shape validity across wave range', () => {
  for (const diff of [1, 3, 5]) {
    it(`all waves 1..200 at difficulty ${diff} pass validateWaveDefinition`, () => {
      for (let w = 1; w <= 200; w++) {
        const def = generate(w, diff, makeRng(w * 31 + diff * 7));
        expect(() => validateWaveDefinition(def, allEnemies)).not.toThrow();
      }
    });
  }
});

describe('waveSpawner — budget invariant', () => {
  for (const diff of [1, 3, 5]) {
    it(`waves 1..200 at difficulty ${diff} never exceed budget`, () => {
      for (let w = 1; w <= 200; w++) {
        const rng = makeRng(w * 17 + diff * 3);
        const def = generate(w, diff, rng);
        const totalCost = def.entries.reduce((sum, entry) => {
          const enemy = allEnemies[entry.enemyId];
          return sum + entry.count * enemy.spawnCost;
        }, 0);
        expect(totalCost).toBeLessThanOrEqual(budget(w, diff));
      }
    });
  }
});

describe('waveSpawner — variety invariant', () => {
  it('waves 3..200 have at least 2 unique enemy types', () => {
    for (let w = 3; w <= 200; w++) {
      const def = generate(w, 1, makeRng(w * 53));
      const uniqueIds = new Set(def.entries.map((e) => e.enemyId));
      expect(uniqueIds.size).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('waveSpawner — no bosses', () => {
  it('no entry is a boss enemy', () => {
    for (let w = 1; w <= 200; w++) {
      const def = generate(w, 3, makeRng(w * 7));
      for (const entry of def.entries) {
        expect(entry.enemyId).not.toBe('boss');
        expect(entry.enemyId).not.toBe('finalBossMap1');
      }
    }
  });
});

describe('waveSpawner — entries well-formed', () => {
  it('hpMul and dmgMul are positive finite numbers', () => {
    for (let w = 1; w <= 50; w++) {
      const def = generate(w, 2, makeRng(w));
      for (const entry of def.entries) {
        expect(Number.isFinite(entry.hpMul)).toBe(true);
        expect(entry.hpMul).toBeGreaterThan(0);
        expect(Number.isFinite(entry.dmgMul)).toBe(true);
        expect(entry.dmgMul).toBeGreaterThan(0);
      }
    }
  });

  it('delayTicks is non-negative and monotonically non-decreasing', () => {
    for (let w = 1; w <= 50; w++) {
      const def = generate(w, 2, makeRng(w));
      let prevDelay = -1;
      for (const entry of def.entries) {
        expect(entry.delayTicks).toBeGreaterThanOrEqual(0);
        expect(entry.delayTicks).toBeGreaterThanOrEqual(prevDelay);
        prevDelay = entry.delayTicks;
      }
    }
  });
});

describe('waveSpawner — meta', () => {
  it('meta.isBoss is false', () => {
    for (let w = 1; w <= 30; w++) {
      const def = generate(w, 1, makeRng(w));
      expect(def.meta.isBoss).toBe(false);
    }
  });

  it('meta.isFinal is false', () => {
    for (let w = 1; w <= 30; w++) {
      const def = generate(w, 1, makeRng(w));
      expect(def.meta.isFinal).toBe(false);
    }
  });

  it('meta.waveNumber matches input', () => {
    for (let w = 1; w <= 10; w++) {
      const def = generate(w, 1, makeRng(w));
      expect(def.meta.waveNumber).toBe(w);
    }
  });
});
