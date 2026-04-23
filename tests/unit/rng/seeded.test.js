import { describe, expect, test } from 'vitest';
import {
  createSeededRng,
  floatInRange,
  intInRange,
  pickWeighted,
  shuffle,
} from '../../../src/rng/seeded.js';

describe('createSeededRng', () => {
  test('determinism: same seed produces identical sequences', () => {
    const a = createSeededRng(42);
    const b = createSeededRng(42);
    const draws = 20;
    for (let i = 0; i < draws; i++) {
      expect(a()).toBe(b());
    }
  });

  test('different seeds produce different first draws', () => {
    const a = createSeededRng(1);
    const b = createSeededRng(2);
    expect(a()).not.toBe(b());
  });

  test('all draws are in [0, 1)', () => {
    const gen = createSeededRng(99);
    for (let i = 0; i < 1000; i++) {
      const v = gen();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('intInRange', () => {
  test('all draws in [min, max] and all values appear', () => {
    const gen = createSeededRng(7);
    const seen = new Set();
    for (let i = 0; i < 10_000; i++) {
      const v = intInRange(gen, 1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    for (let v = 1; v <= 6; v++) {
      expect(seen.has(v)).toBe(true);
    }
  });

  test('edge case: min === max always returns that value', () => {
    const gen = createSeededRng(13);
    for (let i = 0; i < 50; i++) {
      expect(intInRange(gen, 5, 5)).toBe(5);
    }
  });
});

describe('floatInRange', () => {
  test('all draws in [min, max) and none equals max', () => {
    const gen = createSeededRng(17);
    const min = 2.5;
    const max = 8.75;
    for (let i = 0; i < 1000; i++) {
      const v = floatInRange(gen, min, max);
      expect(v).toBeGreaterThanOrEqual(min);
      expect(v).toBeLessThan(max);
    }
  });
});

describe('pickWeighted', () => {
  test('distribution approximates weights within tolerance', () => {
    const gen = createSeededRng(42);
    const entries = [
      { item: 'a', weight: 3 },
      { item: 'b', weight: 1 },
    ];
    const counts = { a: 0, b: 0 };
    const N = 10_000;
    for (let i = 0; i < N; i++) {
      counts[pickWeighted(gen, entries)]++;
    }
    expect(counts.a / N).toBeCloseTo(0.75, 1);
    expect(counts.b / N).toBeCloseTo(0.25, 1);
    expect(Math.abs(counts.a / N - 0.75)).toBeLessThan(0.02);
    expect(Math.abs(counts.b / N - 0.25)).toBeLessThan(0.02);
  });

  test('single entry always returns that item', () => {
    const gen = createSeededRng(1);
    const entries = [{ item: 'only', weight: 5 }];
    for (let i = 0; i < 20; i++) {
      expect(pickWeighted(gen, entries)).toBe('only');
    }
  });

  test('does not mutate entries', () => {
    const gen = createSeededRng(5);
    const entries = [
      { item: 'x', weight: 2 },
      { item: 'y', weight: 8 },
    ];
    const snapshot = JSON.parse(JSON.stringify(entries));
    for (let i = 0; i < 100; i++) {
      pickWeighted(gen, entries);
    }
    expect(entries).toEqual(snapshot);
  });
});

describe('shuffle', () => {
  test('does not mutate the original array', () => {
    const gen = createSeededRng(3);
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffle(gen, original);
    expect(original).toEqual(copy);
  });

  test('result is a permutation: same length and same elements', () => {
    const gen = createSeededRng(11);
    const input = [10, 20, 30, 40, 50];
    const result = shuffle(gen, input);
    expect(result).toHaveLength(input.length);
    expect([...result].sort((a, b) => a - b)).toEqual([...input].sort((a, b) => a - b));
  });

  test('determinism: same seed produces same permutation', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const resultA = shuffle(createSeededRng(77), input);
    const resultB = shuffle(createSeededRng(77), input);
    expect(resultA).toEqual(resultB);
  });
});
