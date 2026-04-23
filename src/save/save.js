import { CURRENT_VERSION, freshState, migrate } from './schema.js';

const PERSONAL_BEST_LIMIT = 10;

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

  function recordPersonalBest(mapId, entry) {
    const state = load();
    const existing = state.personalBests[mapId] ?? [];
    const updated = [...existing, entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, PERSONAL_BEST_LIMIT);
    save({ personalBests: { ...state.personalBests, [mapId]: updated } });
    return updated;
  }

  return { load, save, clear, getVersion, recordPersonalBest };
}
