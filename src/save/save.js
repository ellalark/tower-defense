import { CURRENT_VERSION, freshState, migrate } from './schema.js';

export function createSave(adapter) {
  function load() {
    const blob = adapter.read();
    if (blob === null) return freshState();
    try {
      return migrate(blob);
    } catch (err) {
      console.warn('[save] load failed, returning fresh state:', err.message);
      return freshState();
    }
  }

  function save(partial) {
    const base = load();
    const merged = { ...base, ...partial, version: CURRENT_VERSION };
    adapter.write(merged);
  }

  function clear() {
    adapter.clear();
  }

  function getVersion() {
    const blob = adapter.read();
    if (blob === null) return null;
    return blob.version ?? null;
  }

  return { load, save, clear, getVersion };
}
