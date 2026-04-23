/** WaveDefinition: entries[] each spawn enemyId count times, delayTicks absolute from wave tick 0, spacingTicks between spawns. meta carries waveNumber, isBoss, isFinal (isFinal implies isBoss). */

export const WAVE_ENTRY_KEYS = Object.freeze(['enemyId', 'count', 'spacingTicks', 'delayTicks']);
export const WAVE_META_KEYS = Object.freeze(['waveNumber', 'isBoss', 'isFinal']);

const isPositiveInt = (v) => Number.isInteger(v) && v > 0;
const isNonNegativeInt = (v) => Number.isInteger(v) && v >= 0;

export function isValidWaveEntry(entry) {
  if (!entry) return false;
  if (typeof entry.enemyId !== 'string' || entry.enemyId === '') return false;
  if (!isPositiveInt(entry.count)) return false;
  if (!isNonNegativeInt(entry.spacingTicks)) return false;
  if (!isNonNegativeInt(entry.delayTicks)) return false;
  return true;
}

export function isValidWaveDefinition(def, enemyLookup) {
  if (!def) return false;
  if (!Array.isArray(def.entries) || def.entries.length === 0) return false;
  for (const entry of def.entries) {
    if (!isValidWaveEntry(entry)) return false;
  }
  const { meta } = def;
  if (!meta) return false;
  if (!isPositiveInt(meta.waveNumber)) return false;
  if (typeof meta.isBoss !== 'boolean') return false;
  if (typeof meta.isFinal !== 'boolean') return false;
  if (meta.isFinal && !meta.isBoss) return false;
  if (enemyLookup) {
    for (const entry of def.entries) {
      if (!(entry.enemyId in enemyLookup)) return false;
    }
  }
  return true;
}

export function validateWaveDefinition(def, enemyLookup) {
  if (!def) throw new Error('WaveDefinition must be an object');
  if (!Array.isArray(def.entries) || def.entries.length === 0)
    throw new Error('entries must be a non-empty array');
  for (const entry of def.entries) {
    if (!isValidWaveEntry(entry)) throw new Error(`Invalid wave entry: ${JSON.stringify(entry)}`);
  }
  const { meta } = def;
  if (!meta) throw new Error('meta is required');
  if (!isPositiveInt(meta.waveNumber))
    throw new Error('meta.waveNumber must be a positive integer');
  if (typeof meta.isBoss !== 'boolean') throw new Error('meta.isBoss must be a boolean');
  if (typeof meta.isFinal !== 'boolean') throw new Error('meta.isFinal must be a boolean');
  if (meta.isFinal && !meta.isBoss)
    throw new Error('meta.isFinal implies meta.isBoss must be true');
  if (enemyLookup) {
    for (const entry of def.entries) {
      if (!(entry.enemyId in enemyLookup)) throw new Error(`Unknown enemyId: ${entry.enemyId}`);
    }
  }
  return def;
}
