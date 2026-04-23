import { BurnEffect, SlowEffect, StunEffect } from '../entities/logic/StatusEffect.js';

const MATCHUPS = {
  singleTargetDps: { tank: 1.5, boss: 1.5, fast: 0.7 },
  splash: { grunt: 1.5, fast: 1.5, tank: 0.7 },
  chain: { fast: 1.5, grunt: 1.5, tank: 0.7, boss: 0.7 },
  slow: {},
  support: {},
  economy: {},
};

export function resolveDamage({ amount, type, enemy }) {
  const towerRow = MATCHUPS[type];
  if (!towerRow) return amount;
  const modifier = towerRow[enemy.archetype] ?? 1;
  return amount * modifier;
}

export function applySlow(enemy, { durationTicks, factor }) {
  const existing = enemy.effects.find((e) => e.type === 'slow');
  if (existing) {
    existing.factor = Math.min(existing.factor, factor);
    existing.durationTicks = durationTicks;
  } else {
    enemy.effects.push(new SlowEffect({ durationTicks, factor }));
  }
}

export function applyStun(enemy, { durationTicks }) {
  const existing = enemy.effects.find((e) => e.type === 'stun');
  if (existing) {
    existing.durationTicks = durationTicks;
  } else {
    enemy.effects.push(new StunEffect({ durationTicks }));
  }
}

export function applyBurn(enemy, { durationTicks, dps }) {
  const existing = enemy.effects.find((e) => e.type === 'burn');
  if (existing) {
    existing.dps = Math.max(existing.dps, dps);
    existing.durationTicks = durationTicks;
  } else {
    enemy.effects.push(new BurnEffect({ durationTicks, dps }));
  }
}
