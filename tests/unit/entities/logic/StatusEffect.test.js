import { describe, expect, it, vi } from 'vitest';
import { BurnEffect, SlowEffect, StunEffect } from '../../../../src/entities/logic/StatusEffect.js';

function makeEnemy() {
  return { applyDamage: vi.fn() };
}

function makeWorld() {
  return { onBaseHit: vi.fn(), onEnemyKilled: vi.fn() };
}

describe('SlowEffect', () => {
  it('constructs with type, factor, durationTicks', () => {
    const e = new SlowEffect({ durationTicks: 5, factor: 0.5 });
    expect(e.type).toBe('slow');
    expect(e.factor).toBe(0.5);
    expect(e.durationTicks).toBe(5);
  });

  it('tick decrements durationTicks by 1', () => {
    const e = new SlowEffect({ durationTicks: 3, factor: 0.5 });
    e.tick(makeEnemy(), makeWorld());
    expect(e.durationTicks).toBe(2);
  });

  it('tick does not call applyDamage', () => {
    const enemy = makeEnemy();
    const e = new SlowEffect({ durationTicks: 3, factor: 0.5 });
    e.tick(enemy, makeWorld());
    expect(enemy.applyDamage).not.toHaveBeenCalled();
  });

  it('isExpired returns false while durationTicks > 0', () => {
    const e = new SlowEffect({ durationTicks: 1, factor: 0.5 });
    expect(e.isExpired()).toBe(false);
  });

  it('isExpired returns true when durationTicks <= 0', () => {
    const e = new SlowEffect({ durationTicks: 0, factor: 0.5 });
    expect(e.isExpired()).toBe(true);
  });

  it('isExpired true after tick brings duration to 0', () => {
    const e = new SlowEffect({ durationTicks: 1, factor: 0.5 });
    e.tick(makeEnemy(), makeWorld());
    expect(e.isExpired()).toBe(true);
  });
});

describe('StunEffect', () => {
  it('constructs with type and durationTicks', () => {
    const e = new StunEffect({ durationTicks: 4 });
    expect(e.type).toBe('stun');
    expect(e.durationTicks).toBe(4);
  });

  it('tick decrements durationTicks by 1', () => {
    const e = new StunEffect({ durationTicks: 3 });
    e.tick(makeEnemy(), makeWorld());
    expect(e.durationTicks).toBe(2);
  });

  it('tick does not call applyDamage', () => {
    const enemy = makeEnemy();
    const e = new StunEffect({ durationTicks: 3 });
    e.tick(enemy, makeWorld());
    expect(enemy.applyDamage).not.toHaveBeenCalled();
  });

  it('isExpired returns true when durationTicks <= 0', () => {
    const e = new StunEffect({ durationTicks: 0 });
    expect(e.isExpired()).toBe(true);
  });
});

describe('BurnEffect', () => {
  it('constructs with type, dps, durationTicks', () => {
    const e = new BurnEffect({ durationTicks: 3, dps: 5 });
    expect(e.type).toBe('burn');
    expect(e.dps).toBe(5);
    expect(e.durationTicks).toBe(3);
  });

  it('tick calls enemy.applyDamage with dps and burn type', () => {
    const enemy = makeEnemy();
    const world = makeWorld();
    const e = new BurnEffect({ durationTicks: 3, dps: 5 });
    e.tick(enemy, world);
    expect(enemy.applyDamage).toHaveBeenCalledOnce();
    expect(enemy.applyDamage).toHaveBeenCalledWith(5, 'burn', world);
  });

  it('tick decrements durationTicks by 1', () => {
    const e = new BurnEffect({ durationTicks: 3, dps: 5 });
    e.tick(makeEnemy(), makeWorld());
    expect(e.durationTicks).toBe(2);
  });

  it('isExpired returns true when durationTicks <= 0', () => {
    const e = new BurnEffect({ durationTicks: 0, dps: 5 });
    expect(e.isExpired()).toBe(true);
  });

  it('ticks damage exactly durationTicks times then stops', () => {
    const enemy = makeEnemy();
    const world = makeWorld();
    const e = new BurnEffect({ durationTicks: 2, dps: 3 });
    e.tick(enemy, world);
    e.tick(enemy, world);
    expect(enemy.applyDamage).toHaveBeenCalledTimes(2);
    expect(e.isExpired()).toBe(true);
  });
});
