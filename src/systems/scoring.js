export const SCORING_WEIGHTS = {
  WAVE_POINTS: 100,
  KILL_POINTS: 1,
  BOSS_BONUS: 500,
  DIFFICULTY_MULTIPLIERS: {
    easy: 1.0,
    medium: 1.25,
    'medium-hard': 1.4,
    hard: 1.6,
    hardest: 2.0,
  },
};

export function computeScore({ waveReached, mapDifficulty, kills, bossKills }) {
  const raw =
    waveReached * SCORING_WEIGHTS.WAVE_POINTS +
    kills * SCORING_WEIGHTS.KILL_POINTS +
    bossKills * SCORING_WEIGHTS.BOSS_BONUS;
  return Math.round(raw * SCORING_WEIGHTS.DIFFICULTY_MULTIPLIERS[mapDifficulty]);
}
