import { describe, expect, it } from 'vitest';
import {
  isValidWaveDefinition,
  isValidWaveEntry,
  validateWaveDefinition,
} from '../../../../src/content/waves/_shape.js';

const validEntry = { enemyId: 'grunt', count: 8, spacingTicks: 30, delayTicks: 0 };
const validMeta = { waveNumber: 1, isBoss: false, isFinal: false };
const validDef = { entries: [validEntry], meta: validMeta };

describe('isValidWaveEntry', () => {
  it('accepts a well-formed entry', () => {
    expect(isValidWaveEntry(validEntry)).toBe(true);
  });

  it('rejects missing enemyId', () => {
    const { enemyId: _, ...rest } = validEntry;
    expect(isValidWaveEntry(rest)).toBe(false);
  });

  it('rejects empty string enemyId', () => {
    expect(isValidWaveEntry({ ...validEntry, enemyId: '' })).toBe(false);
  });

  it('rejects non-string enemyId', () => {
    expect(isValidWaveEntry({ ...validEntry, enemyId: 42 })).toBe(false);
  });

  it('rejects missing count', () => {
    const { count: _, ...rest } = validEntry;
    expect(isValidWaveEntry(rest)).toBe(false);
  });

  it('rejects count < 1', () => {
    expect(isValidWaveEntry({ ...validEntry, count: 0 })).toBe(false);
  });

  it('rejects non-integer count', () => {
    expect(isValidWaveEntry({ ...validEntry, count: 1.5 })).toBe(false);
  });

  it('rejects missing spacingTicks', () => {
    const { spacingTicks: _, ...rest } = validEntry;
    expect(isValidWaveEntry(rest)).toBe(false);
  });

  it('rejects negative spacingTicks', () => {
    expect(isValidWaveEntry({ ...validEntry, spacingTicks: -1 })).toBe(false);
  });

  it('rejects non-integer spacingTicks', () => {
    expect(isValidWaveEntry({ ...validEntry, spacingTicks: 0.5 })).toBe(false);
  });

  it('rejects missing delayTicks', () => {
    const { delayTicks: _, ...rest } = validEntry;
    expect(isValidWaveEntry(rest)).toBe(false);
  });

  it('rejects negative delayTicks', () => {
    expect(isValidWaveEntry({ ...validEntry, delayTicks: -1 })).toBe(false);
  });

  it('rejects non-integer delayTicks', () => {
    expect(isValidWaveEntry({ ...validEntry, delayTicks: 0.5 })).toBe(false);
  });
});

describe('isValidWaveDefinition', () => {
  it('accepts a well-formed definition', () => {
    expect(isValidWaveDefinition(validDef)).toBe(true);
  });

  it('rejects empty entries array', () => {
    expect(isValidWaveDefinition({ ...validDef, entries: [] })).toBe(false);
  });

  it('rejects invalid entry inside entries', () => {
    expect(isValidWaveDefinition({ ...validDef, entries: [{ ...validEntry, count: 0 }] })).toBe(
      false,
    );
  });

  it('rejects missing meta', () => {
    const { meta: _, ...rest } = validDef;
    expect(isValidWaveDefinition(rest)).toBe(false);
  });

  it('rejects non-integer waveNumber', () => {
    expect(isValidWaveDefinition({ ...validDef, meta: { ...validMeta, waveNumber: 1.5 } })).toBe(
      false,
    );
  });

  it('rejects waveNumber <= 0', () => {
    expect(isValidWaveDefinition({ ...validDef, meta: { ...validMeta, waveNumber: 0 } })).toBe(
      false,
    );
  });

  it('rejects non-boolean isBoss', () => {
    expect(isValidWaveDefinition({ ...validDef, meta: { ...validMeta, isBoss: 1 } })).toBe(false);
  });

  it('rejects non-boolean isFinal', () => {
    expect(isValidWaveDefinition({ ...validDef, meta: { ...validMeta, isFinal: 1 } })).toBe(false);
  });

  it('rejects isFinal: true with isBoss: false', () => {
    expect(
      isValidWaveDefinition({ ...validDef, meta: { ...validMeta, isFinal: true, isBoss: false } }),
    ).toBe(false);
  });

  it('accepts isFinal: true with isBoss: true', () => {
    expect(
      isValidWaveDefinition({
        entries: [{ enemyId: 'boss', count: 1, spacingTicks: 0, delayTicks: 0 }],
        meta: { waveNumber: 30, isBoss: true, isFinal: true },
      }),
    ).toBe(true);
  });

  it('rejects entry with enemyId not in lookup', () => {
    const lookup = { grunt: {} };
    expect(
      isValidWaveDefinition(
        {
          entries: [{ enemyId: 'unknown', count: 1, spacingTicks: 0, delayTicks: 0 }],
          meta: { waveNumber: 1, isBoss: false, isFinal: false },
        },
        lookup,
      ),
    ).toBe(false);
  });

  it('accepts when all enemyIds are in lookup', () => {
    const lookup = { grunt: {} };
    expect(isValidWaveDefinition(validDef, lookup)).toBe(true);
  });
});

describe('isValidWaveEntry — hpMul / dmgMul', () => {
  it('accepts entry with valid hpMul and dmgMul', () => {
    expect(isValidWaveEntry({ ...validEntry, hpMul: 1.5, dmgMul: 2.0 })).toBe(true);
  });

  it('accepts entry without hpMul or dmgMul', () => {
    expect(isValidWaveEntry(validEntry)).toBe(true);
  });

  it('rejects hpMul: 0', () => {
    expect(isValidWaveEntry({ ...validEntry, hpMul: 0 })).toBe(false);
  });

  it('rejects hpMul: -1', () => {
    expect(isValidWaveEntry({ ...validEntry, hpMul: -1 })).toBe(false);
  });

  it('rejects hpMul: "x"', () => {
    expect(isValidWaveEntry({ ...validEntry, hpMul: 'x' })).toBe(false);
  });

  it('rejects dmgMul: 0', () => {
    expect(isValidWaveEntry({ ...validEntry, dmgMul: 0 })).toBe(false);
  });

  it('rejects dmgMul: -1', () => {
    expect(isValidWaveEntry({ ...validEntry, dmgMul: -1 })).toBe(false);
  });

  it('rejects dmgMul: "x"', () => {
    expect(isValidWaveEntry({ ...validEntry, dmgMul: 'x' })).toBe(false);
  });
});

describe('validateWaveDefinition', () => {
  it('returns def on success', () => {
    expect(validateWaveDefinition(validDef)).toBe(validDef);
  });

  it('throws for invalid def', () => {
    expect(() => validateWaveDefinition({ ...validDef, entries: [] })).toThrow(Error);
  });

  it('throws with a message', () => {
    expect(() => validateWaveDefinition({ ...validDef, entries: [] })).toThrow(/entries/);
  });

  it('throws for isFinal without isBoss', () => {
    expect(() =>
      validateWaveDefinition({
        ...validDef,
        meta: { ...validMeta, isFinal: true, isBoss: false },
      }),
    ).toThrow(Error);
  });

  it('throws for entry with hpMul: 0', () => {
    expect(() =>
      validateWaveDefinition({ ...validDef, entries: [{ ...validEntry, hpMul: 0 }] }),
    ).toThrow(Error);
  });

  it('throws for entry with dmgMul: -1', () => {
    expect(() =>
      validateWaveDefinition({ ...validDef, entries: [{ ...validEntry, dmgMul: -1 }] }),
    ).toThrow(Error);
  });
});
