import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSave } from '../../../src/save/save.js';
import { CURRENT_VERSION, freshState } from '../../../src/save/schema.js';

function makeStubAdapter(initial = null) {
  let blob = initial;
  return {
    read: () => (blob === null ? null : structuredClone(blob)),
    write: (obj) => {
      blob = structuredClone(obj);
    },
    clear: () => {
      blob = null;
    },
    _peek: () => blob,
    _set: (v) => {
      blob = v;
    },
  };
}

describe('createSave', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('load() on empty adapter returns freshState()', () => {
    const adapter = makeStubAdapter();
    const save = createSave(adapter);
    expect(save.load()).toEqual(freshState());
  });

  it('load() on empty adapter does not warn', () => {
    const adapter = makeStubAdapter();
    const save = createSave(adapter);
    save.load();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('round-trip: save then load preserves tutorialCompleted and other fields', () => {
    const adapter = makeStubAdapter();
    const save = createSave(adapter);
    save.save({ tutorialCompleted: true });
    const result = save.load();
    expect(result.tutorialCompleted).toBe(true);
    expect(result.unlockedMaps).toEqual(['map1']);
    expect(result.version).toBe(CURRENT_VERSION);
  });

  it('save() does a shallow merge — settings is replaced, not deep-merged', () => {
    const adapter = makeStubAdapter();
    const save = createSave(adapter);
    save.save({ settings: { volume: 0.5 } });
    const result = save.load();
    expect(result.settings).toEqual({ volume: 0.5 });
    expect(result.unlockedMaps).toEqual(['map1']);
  });

  it('load() with a valid v1 blob passes through migrate without fallback', () => {
    const validBlob = { ...freshState(), unlockedMaps: ['map1', 'map2'] };
    const adapter = makeStubAdapter(validBlob);
    const save = createSave(adapter);
    const result = save.load();
    expect(result.unlockedMaps).toEqual(['map1', 'map2']);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('load() with a broken migration chain (v0, no migrations) falls back to freshState() with warn', () => {
    const adapter = makeStubAdapter({ version: 0 });
    const save = createSave(adapter);
    const result = save.load();
    expect(result).toEqual(freshState());
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('load() with corrupt blob (no version) returns freshState() and warns', () => {
    const adapter = makeStubAdapter({ foo: 'bar' });
    const save = createSave(adapter);
    const result = save.load();
    expect(result).toEqual(freshState());
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('load() with future-version blob returns freshState() and warns', () => {
    const adapter = makeStubAdapter({ version: 99 });
    const save = createSave(adapter);
    const result = save.load();
    expect(result).toEqual(freshState());
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('save() stamps CURRENT_VERSION even when partial contains a different version', () => {
    const adapter = makeStubAdapter();
    const save = createSave(adapter);
    save.save({ version: 42 });
    expect(adapter._peek().version).toBe(CURRENT_VERSION);
  });

  it('save() on empty adapter writes freshState() shallow-merged with partial', () => {
    const adapter = makeStubAdapter();
    const save = createSave(adapter);
    save.save({ tutorialCompleted: true });
    const expected = { ...freshState(), tutorialCompleted: true, version: CURRENT_VERSION };
    expect(adapter._peek()).toEqual(expected);
  });

  it('save() on corrupt blob uses freshState() as merge base', () => {
    const adapter = makeStubAdapter({ foo: 'bar' });
    const save = createSave(adapter);
    save.save({ tutorialCompleted: true });
    const expected = { ...freshState(), tutorialCompleted: true, version: CURRENT_VERSION };
    expect(adapter._peek()).toEqual(expected);
  });

  it('clear() empties the adapter; subsequent load() returns freshState() and getVersion() returns null', () => {
    const adapter = makeStubAdapter(freshState());
    const save = createSave(adapter);
    save.clear();
    expect(save.load()).toEqual(freshState());
    expect(save.getVersion()).toBe(null);
  });

  it('getVersion() returns null on empty adapter', () => {
    const adapter = makeStubAdapter();
    const save = createSave(adapter);
    expect(save.getVersion()).toBe(null);
  });

  it('getVersion() returns the version number from the stored blob', () => {
    const adapter = makeStubAdapter({ version: 1 });
    const save = createSave(adapter);
    expect(save.getVersion()).toBe(1);

    adapter._set({ version: 7 });
    expect(save.getVersion()).toBe(7);
  });

  it('getVersion() returns null when blob has no version field', () => {
    const adapter = makeStubAdapter({ foo: 'bar' });
    const save = createSave(adapter);
    expect(save.getVersion()).toBe(null);
  });

  it('getVersion() does not emit any warn', () => {
    const adapter = makeStubAdapter({ foo: 'bar' });
    const save = createSave(adapter);
    save.getVersion();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
