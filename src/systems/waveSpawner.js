import { grunt } from '../content/enemies/grunt.js';
import { fast } from '../content/enemies/fast.js';
import { flying } from '../content/enemies/flying.js';
import { shielded } from '../content/enemies/shielded.js';
import { stealth } from '../content/enemies/stealth.js';
import { splitter } from '../content/enemies/splitter.js';
import { healer } from '../content/enemies/healer.js';
import { tank } from '../content/enemies/tank.js';
import { pickWeighted } from '../rng/seeded.js';

// 1 at diff 1, scales linearly to 1.6 at diff 5
const diffScalar = (diff) => 1 + 0.15 * (diff - 1);

export const budget = (wave, diff) =>
  Math.floor((5 + 2 * wave) * diffScalar(diff));

export const hpMul = (wave, diff) => (1 + 0.05 * (wave - 1)) * diffScalar(diff);

export const dmgMul = (wave, diff) => (1 + 0.04 * (wave - 1)) * diffScalar(diff);

const POOL = [
  { enemy: grunt, weight: (w) => Math.max(0.1, 5 - 0.1 * w) },
  { enemy: fast, weight: (w) => Math.max(0.1, 4 - 0.08 * w) },
  { enemy: flying, weight: (w) => Math.max(0, (w - 3) * 0.3) },
  { enemy: shielded, weight: (w) => Math.max(0, (w - 4) * 0.25) },
  { enemy: stealth, weight: (w) => Math.max(0, (w - 6) * 0.2) },
  { enemy: splitter, weight: (w) => Math.max(0, (w - 5) * 0.2) },
  { enemy: healer, weight: (w) => Math.max(0, (w - 8) * 0.15) },
  { enemy: tank, weight: (w) => Math.max(0, (w - 3) * 0.2) },
];

export function generate(waveNumber, mapDifficulty, rng) {
  const totalBudget = budget(waveNumber, mapDifficulty);
  const wp = hpMul(waveNumber, mapDifficulty);
  const wd = dmgMul(waveNumber, mapDifficulty);

  const eligibleTypes = POOL.map((p) => ({ enemy: p.enemy, w: p.weight(waveNumber) }))
    .filter((p) => p.w > 0)
    .sort((a, b) => b.w - a.w);

  const picks = [];
  let budgetRemaining = totalBudget;

  if (waveNumber >= 3 && eligibleTypes.length >= 2) {
    for (const t of [eligibleTypes[0], eligibleTypes[1]]) {
      if (t.enemy.spawnCost <= budgetRemaining) {
        picks.push(t.enemy);
        budgetRemaining -= t.enemy.spawnCost;
      }
    }
  }

  while (true) {
    const affordable = eligibleTypes.filter((t) => t.enemy.spawnCost <= budgetRemaining);
    if (affordable.length === 0) break;
    const chosen = pickWeighted(rng, affordable.map((t) => ({ weight: t.w, item: t.enemy })));
    picks.push(chosen);
    budgetRemaining -= chosen.spawnCost;
  }

  const grouped = [];
  for (const enemy of picks) {
    const last = grouped[grouped.length - 1];
    if (last && last.id === enemy.id) {
      last.count++;
    } else {
      grouped.push({ id: enemy.id, count: 1 });
    }
  }

  const spacing = Math.max(10, 30 - Math.floor(waveNumber / 10));
  let delay = 0;
  const waveDef = {
    entries: grouped.map((g) => {
      const entry = {
        enemyId: g.id,
        count: g.count,
        spacingTicks: spacing,
        delayTicks: delay,
        hpMul: wp,
        dmgMul: wd,
      };
      delay += g.count * spacing;
      return entry;
    }),
    meta: { waveNumber, isBoss: false, isFinal: false },
  };

  return waveDef;
}
