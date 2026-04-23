import { describe, expect, it } from 'vitest';
import { enemies, mapBosses } from '../../../../src/content/enemies/index.js';
import { isValidWaveDefinition } from '../../../../src/content/waves/_shape.js';
import { map1Waves } from '../../../../src/content/waves/map1.js';

const lookup = { ...enemies, ...mapBosses };

describe('map1Waves', () => {
  it('contains exactly the expected wave numbers', () => {
    expect(
      Object.keys(map1Waves)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual([1, 2, 3, 10, 20, 30]);
  });

  it('every wave passes isValidWaveDefinition with merged lookup', () => {
    for (const [num, wave] of Object.entries(map1Waves)) {
      expect(isValidWaveDefinition(wave, lookup), `wave ${num} invalid`).toBe(true);
    }
  });

  it('waves 10 and 20 have isBoss: true and isFinal: false', () => {
    expect(map1Waves[10].meta.isBoss).toBe(true);
    expect(map1Waves[10].meta.isFinal).toBe(false);
    expect(map1Waves[20].meta.isBoss).toBe(true);
    expect(map1Waves[20].meta.isFinal).toBe(false);
  });

  it('wave 30 has isFinal: true and references finalBossMap1', () => {
    expect(map1Waves[30].meta.isFinal).toBe(true);
    expect(map1Waves[30].entries[0].enemyId).toBe('finalBossMap1');
  });

  it('each entry enemyId resolves in merged lookup', () => {
    for (const [num, wave] of Object.entries(map1Waves)) {
      for (const entry of wave.entries) {
        expect(lookup, `wave ${num} entry ${entry.enemyId} not in lookup`).toHaveProperty(
          entry.enemyId,
        );
      }
    }
  });
});
