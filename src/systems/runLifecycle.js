import { BASE_HP_DEFAULT, STARTING_BUDGET_DEFAULT } from '../config/constants.js';
import { getState, reset, setState } from '../state/store.js';
import { computeScore } from './scoring.js';

export function createRunLifecycle(save) {
  function startRun({ map, seed }) {
    const resolvedSeed = seed ?? Date.now();
    reset();
    setState({
      runSeed: resolvedSeed,
      currency: map.startingBudget ?? STARTING_BUDGET_DEFAULT,
      baseHp: map.baseHp ?? BASE_HP_DEFAULT,
      uiMode: 'prep',
    });
    return { seed: resolvedSeed };
  }

  function endRun({ map, outcome }) {
    const score = computeScore({
      waveReached: outcome.waveReached,
      mapDifficulty: map.difficulty,
      kills: outcome.kills,
      bossKills: outcome.bossKills,
    });
    const pbEntry = {
      score,
      waveReached: outcome.waveReached,
      kills: outcome.kills,
      seed: getState().runSeed,
    };
    save.recordPersonalBest(map.id, pbEntry);

    const unlocked = { mapId: null, towerId: null };
    if (outcome.finalBossDefeated) {
      const savedState = save.load();
      const { unlockedMaps, unlockedTowers } = savedState;
      let mapsChanged = false;
      let towersChanged = false;
      const newMaps = [...unlockedMaps];
      const newTowers = [...unlockedTowers];

      if (map.unlocksMapId != null && !unlockedMaps.includes(map.unlocksMapId)) {
        newMaps.push(map.unlocksMapId);
        unlocked.mapId = map.unlocksMapId;
        mapsChanged = true;
      }
      if (map.unlocksTowerId != null && !unlockedTowers.includes(map.unlocksTowerId)) {
        newTowers.push(map.unlocksTowerId);
        unlocked.towerId = map.unlocksTowerId;
        towersChanged = true;
      }
      if (mapsChanged || towersChanged) {
        save.save({ unlockedMaps: newMaps, unlockedTowers: newTowers });
      }
    }

    return { score, finalBossDefeated: outcome.finalBossDefeated, unlocked };
  }

  return { startRun, endRun };
}
