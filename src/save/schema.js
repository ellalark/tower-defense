export const CURRENT_VERSION = 1;

export const migrations = [];

export function freshState() {
  return {
    version: 1,
    unlockedMaps: ['map1'],
    unlockedTowers: ['singleTargetDps', 'support'],
    personalBests: {},
    tutorialCompleted: false,
    settings: { volume: 1.0, speedDefault: 1 },
  };
}

export function migrate(oldState, customMigrations = migrations) {
  if (oldState.version === undefined) {
    throw new Error('save schema: missing version');
  }
  if (oldState.version > CURRENT_VERSION) {
    throw new Error(
      `save schema: version ${oldState.version} is newer than CURRENT_VERSION ${CURRENT_VERSION}`,
    );
  }
  if (oldState.version === CURRENT_VERSION) {
    return structuredClone(oldState);
  }
  let state = structuredClone(oldState);
  let currentVersion = state.version;
  while (currentVersion < CURRENT_VERSION) {
    const entry = customMigrations.find((e) => e.from === currentVersion);
    if (!entry) {
      throw new Error(`save schema: no migration from version ${currentVersion}`);
    }
    const result = entry.apply(state);
    state = result ?? state;
    currentVersion = entry.to;
  }
  return state;
}
