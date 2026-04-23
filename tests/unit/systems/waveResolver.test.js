import { describe, expect, it } from 'vitest';
import { map1Waves } from '../../../src/content/waves/map1.js';
import { createSeededRng } from '../../../src/rng/seeded.js';
import { resolveWaveForNumber } from '../../../src/systems/waveResolver.js';
import { generate } from '../../../src/systems/waveSpawner.js';

describe('resolveWaveForNumber — scripted waves', () => {
  it('wave 1 on map1 returns exact scripted definition', () => {
    const rng = createSeededRng(1);
    expect(resolveWaveForNumber('map1', 1, rng)).toEqual(map1Waves[1]);
  });

  it('wave 2 on map1 returns exact scripted definition', () => {
    const rng = createSeededRng(2);
    expect(resolveWaveForNumber('map1', 2, rng)).toEqual(map1Waves[2]);
  });

  it('wave 3 on map1 returns exact scripted definition', () => {
    const rng = createSeededRng(3);
    expect(resolveWaveForNumber('map1', 3, rng)).toEqual(map1Waves[3]);
  });

  it('wave 10 on map1 returns scripted with isBoss === true', () => {
    const rng = createSeededRng(10);
    const result = resolveWaveForNumber('map1', 10, rng);
    expect(result).toEqual(map1Waves[10]);
    expect(result.meta.isBoss).toBe(true);
  });

  it('wave 20 on map1 returns scripted with isBoss === true', () => {
    const rng = createSeededRng(20);
    const result = resolveWaveForNumber('map1', 20, rng);
    expect(result).toEqual(map1Waves[20]);
    expect(result.meta.isBoss).toBe(true);
  });

  it('wave 30 on map1 returns scripted with isFinal === true', () => {
    const rng = createSeededRng(30);
    const result = resolveWaveForNumber('map1', 30, rng);
    expect(result).toEqual(map1Waves[30]);
    expect(result.meta.isFinal).toBe(true);
  });
});

describe('resolveWaveForNumber — procedural fallback', () => {
  it('wave 4 on map1 matches generate output with same-seed rng', () => {
    const seed = 999;
    const rngA = createSeededRng(seed);
    const rngB = createSeededRng(seed);
    const resolved = resolveWaveForNumber('map1', 4, rngA);
    const generated = generate(4, 1, rngB);
    expect(resolved).toEqual(generated);
  });

  it('wave 11 on map1 matches generate output with same-seed rng', () => {
    const seed = 777;
    const rngA = createSeededRng(seed);
    const rngB = createSeededRng(seed);
    const resolved = resolveWaveForNumber('map1', 11, rngA);
    const generated = generate(11, 1, rngB);
    expect(resolved).toEqual(generated);
  });

  it('wave 29 on map1 matches generate output with same-seed rng', () => {
    const seed = 555;
    const rngA = createSeededRng(seed);
    const rngB = createSeededRng(seed);
    const resolved = resolveWaveForNumber('map1', 29, rngA);
    const generated = generate(29, 1, rngB);
    expect(resolved).toEqual(generated);
  });
});

describe('resolveWaveForNumber — error cases', () => {
  it('throws for unknown mapId', () => {
    const rng = createSeededRng(1);
    expect(() => resolveWaveForNumber('map99', 1, rng)).toThrow('unknown mapId: map99');
  });
});
