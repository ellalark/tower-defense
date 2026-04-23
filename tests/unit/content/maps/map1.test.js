import { describe, expect, it } from 'vitest';
import { map1 } from '../../../../src/content/maps/map1.js';
import { buildPath } from '../../../../src/systems/pathing.js';

describe('map1', () => {
  it('has theme cute-alien-planet', () => {
    expect(map1.theme).toBe('cute-alien-planet');
  });

  it('has targetWave 30', () => {
    expect(map1.targetWave).toBe(30);
  });

  it('has finalBoss finalBossMap1', () => {
    expect(map1.finalBoss).toBe('finalBossMap1');
  });

  it('waypoints produce a positive totalLength path', () => {
    const path = buildPath(map1.waypoints);
    expect(path.totalLength).toBeGreaterThan(0);
  });

  it('buildableMask is a Uint8Array of length 576', () => {
    expect(map1.buildableMask).toBeInstanceOf(Uint8Array);
    expect(map1.buildableMask.length).toBe(576);
  });

  it('buildableMask has buildable cells (count of 1s > 0)', () => {
    const ones = [...map1.buildableMask].filter((v) => v === 1).length;
    expect(ones).toBeGreaterThan(0);
  });

  it('buildableMask has blocked cells (count of 0s > 0)', () => {
    const zeros = [...map1.buildableMask].filter((v) => v === 0).length;
    expect(zeros).toBeGreaterThan(0);
  });
});
