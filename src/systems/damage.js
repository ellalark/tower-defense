import { BurnEffect, SlowEffect, StunEffect } from '../entities/logic/StatusEffect.js';

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
