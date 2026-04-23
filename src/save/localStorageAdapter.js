import { SAVE_NAMESPACE } from '../config/constants.js';

export function createLocalStorageAdapter(storage = globalThis.localStorage) {
  function read() {
    const raw = storage.getItem(SAVE_NAMESPACE);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function write(obj) {
    storage.setItem(SAVE_NAMESPACE, JSON.stringify(obj));
  }

  function clear() {
    storage.removeItem(SAVE_NAMESPACE);
  }

  return { read, write, clear };
}
