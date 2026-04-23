import { maps } from '../content/maps/index.js';
import { scriptedWaves } from '../content/waves/index.js';
import { generate } from './waveSpawner.js';

const DIFFICULTY_TIER = {
  easy: 1,
  medium: 3,
  'medium-hard': 4,
  hard: 5,
  hardest: 6,
};

export function resolveWaveForNumber(mapId, waveNumber, rng) {
  const map = maps[mapId];
  if (!map) throw new Error(`unknown mapId: ${mapId}`);

  const scripted = scriptedWaves[mapId]?.[waveNumber];
  if (scripted !== undefined) return scripted;

  const tier = DIFFICULTY_TIER[map.difficulty];
  if (tier === undefined) throw new Error(`unknown difficulty: ${map.difficulty}`);

  return generate(waveNumber, tier, rng);
}
