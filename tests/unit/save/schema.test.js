import { describe, expect, test } from 'vitest';
import { CURRENT_VERSION, freshState, migrate, migrations } from '../../../src/save/schema.js';

describe('freshState', () => {
  test('returns correct shape with v1 defaults', () => {
    const s = freshState();
    expect(s.version).toBe(1);
    expect(s.unlockedMaps).toEqual(['map1']);
    expect(s.unlockedTowers).toEqual(['singleTargetDps', 'support']);
    expect(s.personalBests).toEqual({});
    expect(s.tutorialCompleted).toBe(false);
    expect(s.settings.volume).toBe(1.0);
    expect(s.settings.speedDefault).toBe(1);
  });

  test('each call returns a distinct object', () => {
    const a = freshState();
    const b = freshState();
    expect(a).not.toBe(b);
    a.unlockedMaps.push('extra');
    expect(b.unlockedMaps).toEqual(['map1']);
  });
});

describe('CURRENT_VERSION', () => {
  test('is 1', () => {
    expect(CURRENT_VERSION).toBe(1);
  });
});

describe('migrations', () => {
  test('is an empty array for v1', () => {
    expect(Array.isArray(migrations)).toBe(true);
    expect(migrations).toHaveLength(0);
  });
});

describe('migrate', () => {
  test('v1 passthrough returns deeply equal but distinct object', () => {
    const input = freshState();
    const result = migrate(input);
    expect(result).toEqual(input);
    expect(result).not.toBe(input);
  });

  test('v1 passthrough does not mutate input', () => {
    const input = freshState();
    const result = migrate(input);
    result.tutorialCompleted = true;
    result.unlockedMaps.push('extra');
    expect(input.tutorialCompleted).toBe(false);
    expect(input.unlockedMaps).toEqual(['map1']);
  });

  test('fake v0→v1 chain walks correctly', () => {
    const fakeV0 = { version: 0, foo: 'bar' };
    const fakeChain = [
      {
        from: 0,
        to: 1,
        apply: (s) => {
          s.version = 1;
          s.migrated = true;
        },
      },
    ];
    const result = migrate(fakeV0, fakeChain);
    expect(result.version).toBe(1);
    expect(result.migrated).toBe(true);
    expect(result.foo).toBe('bar');
  });

  test('apply that returns a new object is handled', () => {
    const fakeV0 = { version: 0, foo: 'bar' };
    const fakeChain = [{ from: 0, to: 1, apply: (s) => ({ ...s, version: 1, replaced: true }) }];
    const result = migrate(fakeV0, fakeChain);
    expect(result.version).toBe(1);
    expect(result.replaced).toBe(true);
    expect(result.foo).toBe('bar');
  });

  test('throws on missing version', () => {
    expect(() => migrate({})).toThrow(/missing version/);
  });

  test('throws on version newer than CURRENT_VERSION', () => {
    expect(() => migrate({ version: 99 })).toThrow(/newer than/);
  });

  test('throws on broken chain', () => {
    expect(() => migrate({ version: 0 }, [])).toThrow(/no migration from version 0/);
  });

  test('input not mutated after v0→v1 migration', () => {
    const input = { version: 0, foo: 'bar' };
    const fakeChain = [
      {
        from: 0,
        to: 1,
        apply: (s) => {
          s.version = 1;
          s.migrated = true;
        },
      },
    ];
    migrate(input, fakeChain);
    expect(input.version).toBe(0);
    expect(input.migrated).toBeUndefined();
  });
});
