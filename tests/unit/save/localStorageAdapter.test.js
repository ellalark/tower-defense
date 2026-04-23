import { beforeEach, describe, expect, it } from 'vitest';
import { SAVE_NAMESPACE } from '../../../src/config/constants.js';
import { createLocalStorageAdapter } from '../../../src/save/localStorageAdapter.js';

function createFakeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
    _map: map,
  };
}

describe('createLocalStorageAdapter', () => {
  let storage;
  let adapter;

  beforeEach(() => {
    storage = createFakeStorage();
    adapter = createLocalStorageAdapter(storage);
  });

  it('read() returns null when the key is absent', () => {
    expect(adapter.read()).toBe(null);
  });

  it('read() returns null when stored value is malformed JSON', () => {
    storage.setItem(SAVE_NAMESPACE, '{not json');
    expect(adapter.read()).toBe(null);
  });

  it('read() returns the parsed object when valid JSON is stored', () => {
    const obj = { wave: 5, currency: 100 };
    storage.setItem(SAVE_NAMESPACE, JSON.stringify(obj));
    expect(adapter.read()).toEqual(obj);
  });

  it('write(obj) stores JSON.stringify(obj) under the namespace key', () => {
    const obj = { wave: 3 };
    adapter.write(obj);
    expect(storage._map.get(SAVE_NAMESPACE)).toBe(JSON.stringify(obj));
  });

  it('write() then read() round-trips a non-trivial object', () => {
    const obj = {
      version: 1,
      settings: { volume: 0.8, speed: 2 },
      unlocks: ['map1', 'map2'],
      completed: true,
      wave: 42,
    };
    adapter.write(obj);
    expect(adapter.read()).toEqual(obj);
  });

  it('clear() removes only the namespace key, leaving other keys intact', () => {
    storage.setItem('other-key', 'other-value');
    adapter.write({ wave: 1 });
    adapter.clear();
    expect(storage._map.has(SAVE_NAMESPACE)).toBe(false);
    expect(storage._map.get('other-key')).toBe('other-value');
  });

  it('uses SAVE_NAMESPACE from constants as the storage key', () => {
    adapter.write({ x: 1 });
    expect(storage._map.has(SAVE_NAMESPACE)).toBe(true);
  });
});
