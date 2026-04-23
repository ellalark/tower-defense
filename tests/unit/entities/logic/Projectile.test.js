import { describe, expect, it, vi } from 'vitest';
import { Projectile } from '../../../../src/entities/logic/Projectile.js';

function makeEnemy(x, y, hp = 10) {
  return { x, y, hp, applyDamage: vi.fn() };
}

function makeWorld(enemies = []) {
  return { enemies };
}

describe('Projectile – construction', () => {
  it('stores all fields and initializes removed to false', () => {
    const target = makeEnemy(10, 0);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'homing',
      speed: 5,
      damage: 20,
      damageType: 'physical',
      hitRadius: 2,
      lifetimeTicks: 10,
      target,
      splashRadius: 0,
    });
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
    expect(p.mode).toBe('homing');
    expect(p.speed).toBe(5);
    expect(p.damage).toBe(20);
    expect(p.damageType).toBe('physical');
    expect(p.hitRadius).toBe(2);
    expect(p.lifetimeTicks).toBe(10);
    expect(p.target).toBe(target);
    expect(p.splashRadius).toBe(0);
    expect(p.removed).toBe(false);
  });

  it('splashRadius defaults to 0 when undefined', () => {
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 1,
      damage: 5,
      damageType: 'fire',
      hitRadius: 1,
      lifetimeTicks: 5,
      direction: { dx: 1, dy: 0 },
    });
    expect(p.splashRadius).toBe(0);
  });
});

describe('Projectile – straight-line mode', () => {
  it('advances position by speed * dt each tick', () => {
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 3,
      damage: 10,
      damageType: 'physical',
      hitRadius: 1,
      lifetimeTicks: 10,
      direction: { dx: 1, dy: 0 },
    });
    p.tick(1, makeWorld());
    expect(p.x).toBeCloseTo(3);
    expect(p.y).toBeCloseTo(0);
    p.tick(2, makeWorld());
    expect(p.x).toBeCloseTo(9);
    expect(p.y).toBeCloseTo(0);
  });

  it('advances along a diagonal direction', () => {
    const mag = Math.hypot(1, 1);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 2,
      damage: 5,
      damageType: 'physical',
      hitRadius: 1,
      lifetimeTicks: 5,
      direction: { dx: 1 / mag, dy: 1 / mag },
    });
    p.tick(1, makeWorld());
    expect(p.x).toBeCloseTo(2 / mag);
    expect(p.y).toBeCloseTo(2 / mag);
  });

  it('hits an enemy within hitRadius, calls applyDamage, sets removed', () => {
    const enemy = makeEnemy(3, 0);
    const world = makeWorld([enemy]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 3,
      damage: 10,
      damageType: 'physical',
      hitRadius: 0.5,
      lifetimeTicks: 5,
      direction: { dx: 1, dy: 0 },
    });
    p.tick(1, world);
    expect(p.removed).toBe(true);
    expect(enemy.applyDamage).toHaveBeenCalledOnce();
    expect(enemy.applyDamage).toHaveBeenCalledWith(10, 'physical', world);
  });

  it('hits the closest enemy when multiple are within hitRadius', () => {
    const near = makeEnemy(3.1, 0);
    const far = makeEnemy(3.3, 0);
    const world = makeWorld([far, near]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 3,
      damage: 10,
      damageType: 'physical',
      hitRadius: 1,
      lifetimeTicks: 5,
      direction: { dx: 1, dy: 0 },
    });
    p.tick(1, world);
    expect(near.applyDamage).toHaveBeenCalledOnce();
    expect(far.applyDamage).not.toHaveBeenCalled();
  });

  it('tiebreak: first enemy in iteration order wins when distances are equal', () => {
    const a = makeEnemy(3, 0);
    const b = makeEnemy(3, 0);
    const world = makeWorld([a, b]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 3,
      damage: 10,
      damageType: 'physical',
      hitRadius: 1,
      lifetimeTicks: 5,
      direction: { dx: 1, dy: 0 },
    });
    p.tick(1, world);
    expect(a.applyDamage).toHaveBeenCalledOnce();
    expect(b.applyDamage).not.toHaveBeenCalled();
  });

  it('does not hit when all enemies are beyond hitRadius', () => {
    const enemy = makeEnemy(10, 0);
    const world = makeWorld([enemy]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 3,
      damage: 10,
      damageType: 'physical',
      hitRadius: 0.5,
      lifetimeTicks: 5,
      direction: { dx: 1, dy: 0 },
    });
    p.tick(1, world);
    expect(p.removed).toBe(false);
    expect(enemy.applyDamage).not.toHaveBeenCalled();
  });

  it('skips dead enemies (hp <= 0) during collision check', () => {
    const dead = makeEnemy(3, 0, 0);
    const world = makeWorld([dead]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 3,
      damage: 10,
      damageType: 'physical',
      hitRadius: 0.5,
      lifetimeTicks: 5,
      direction: { dx: 1, dy: 0 },
    });
    p.tick(1, world);
    expect(p.removed).toBe(false);
    expect(dead.applyDamage).not.toHaveBeenCalled();
  });

  it('decrements lifetimeTicks each tick without hit', () => {
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 1,
      damage: 5,
      damageType: 'physical',
      hitRadius: 0.1,
      lifetimeTicks: 3,
      direction: { dx: 1, dy: 0 },
    });
    p.tick(1, makeWorld());
    expect(p.lifetimeTicks).toBe(2);
    p.tick(1, makeWorld());
    expect(p.lifetimeTicks).toBe(1);
  });
});

describe('Projectile – lifetime expiry', () => {
  it('lifetimeTicks=1 gets exactly one tick of work, removed on second tick', () => {
    const enemy = makeEnemy(100, 0);
    const world = makeWorld([enemy]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 1,
      damage: 5,
      damageType: 'physical',
      hitRadius: 0.1,
      lifetimeTicks: 1,
      direction: { dx: 1, dy: 0 },
    });
    p.tick(1, world);
    expect(p.removed).toBe(false);
    expect(p.x).toBeCloseTo(1);
    p.tick(1, world);
    expect(p.removed).toBe(true);
    expect(enemy.applyDamage).not.toHaveBeenCalled();
  });

  it('lifetimeTicks=0 at construction: first tick removes immediately, no movement', () => {
    const p = new Projectile({
      x: 5,
      y: 5,
      mode: 'straight',
      speed: 3,
      damage: 10,
      damageType: 'physical',
      hitRadius: 1,
      lifetimeTicks: 0,
      direction: { dx: 1, dy: 0 },
    });
    p.tick(1, makeWorld());
    expect(p.removed).toBe(true);
    expect(p.x).toBe(5);
    expect(p.y).toBe(5);
  });

  it('expired projectile never calls applyDamage even if enemy in range', () => {
    const enemy = makeEnemy(1, 0);
    const world = makeWorld([enemy]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 3,
      damage: 10,
      damageType: 'physical',
      hitRadius: 5,
      lifetimeTicks: 0,
      direction: { dx: 1, dy: 0 },
    });
    p.tick(1, world);
    expect(enemy.applyDamage).not.toHaveBeenCalled();
  });
});

describe('Projectile – homing mode', () => {
  it('updates direction toward target each tick', () => {
    const target = makeEnemy(10, 0);
    const world = makeWorld([target]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'homing',
      speed: 1,
      damage: 5,
      damageType: 'physical',
      hitRadius: 0.1,
      lifetimeTicks: 100,
      target,
      direction: { dx: 0, dy: 1 },
    });
    p.tick(1, world);
    expect(p.direction.dx).toBeCloseTo(1);
    expect(p.direction.dy).toBeCloseTo(0);
  });

  it('tracks a moving target by updating direction each tick', () => {
    const target = makeEnemy(0, 10);
    const world = makeWorld([target]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'homing',
      speed: 1,
      damage: 5,
      damageType: 'physical',
      hitRadius: 0.1,
      lifetimeTicks: 100,
      target,
      direction: { dx: 1, dy: 0 },
    });
    p.tick(1, world);
    const dirAfterTick1 = { ...p.direction };
    target.x = 20;
    target.y = 0;
    p.tick(1, world);
    expect(p.direction.dx).not.toBeCloseTo(dirAfterTick1.dx);
  });

  it('marks removed when target.hp <= 0, no movement or damage', () => {
    const target = makeEnemy(10, 0, 0);
    const world = makeWorld([target]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'homing',
      speed: 5,
      damage: 10,
      damageType: 'physical',
      hitRadius: 1,
      lifetimeTicks: 10,
      target,
      direction: { dx: 1, dy: 0 },
    });
    p.tick(1, world);
    expect(p.removed).toBe(true);
    expect(p.x).toBe(0);
    expect(target.applyDamage).not.toHaveBeenCalled();
  });

  it('hits target when within hitRadius and calls applyDamage', () => {
    const target = makeEnemy(3, 0);
    const world = makeWorld([target]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'homing',
      speed: 3,
      damage: 15,
      damageType: 'magic',
      hitRadius: 0.5,
      lifetimeTicks: 10,
      target,
      direction: { dx: 1, dy: 0 },
    });
    p.tick(1, world);
    expect(p.removed).toBe(true);
    expect(target.applyDamage).toHaveBeenCalledOnce();
    expect(target.applyDamage).toHaveBeenCalledWith(15, 'magic', world);
  });

  it('does not divide by zero when projectile is exactly at target position', () => {
    const target = makeEnemy(0, 0);
    const world = makeWorld([target]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'homing',
      speed: 1,
      damage: 5,
      damageType: 'physical',
      hitRadius: 2,
      lifetimeTicks: 10,
      target,
      direction: { dx: 1, dy: 0 },
    });
    expect(() => p.tick(1, world)).not.toThrow();
    expect(p.direction.dx).toBe(1);
    expect(p.direction.dy).toBe(0);
  });
});

describe('Projectile – splash', () => {
  it('splashRadius>0 damages all live enemies within splash of impact', () => {
    const a = makeEnemy(3, 0);
    const b = makeEnemy(3, 2);
    const c = makeEnemy(3, 10);
    const world = makeWorld([a, b, c]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 3,
      damage: 10,
      damageType: 'fire',
      hitRadius: 0.5,
      lifetimeTicks: 5,
      direction: { dx: 1, dy: 0 },
      splashRadius: 3,
    });
    p.tick(1, world);
    expect(p.removed).toBe(true);
    expect(a.applyDamage).toHaveBeenCalledOnce();
    expect(a.applyDamage).toHaveBeenCalledWith(10, 'fire', world);
    expect(b.applyDamage).toHaveBeenCalledOnce();
    expect(b.applyDamage).toHaveBeenCalledWith(10, 'fire', world);
    expect(c.applyDamage).not.toHaveBeenCalled();
  });

  it('collision trigger enemy is included in splash', () => {
    const trigger = makeEnemy(3, 0);
    const world = makeWorld([trigger]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 3,
      damage: 10,
      damageType: 'fire',
      hitRadius: 0.5,
      lifetimeTicks: 5,
      direction: { dx: 1, dy: 0 },
      splashRadius: 5,
    });
    p.tick(1, world);
    expect(trigger.applyDamage).toHaveBeenCalledOnce();
  });

  it('splashRadius=0 hits only the collision target', () => {
    const a = makeEnemy(3, 0);
    const b = makeEnemy(3, 1);
    const world = makeWorld([a, b]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 3,
      damage: 10,
      damageType: 'physical',
      hitRadius: 2,
      lifetimeTicks: 5,
      direction: { dx: 1, dy: 0 },
      splashRadius: 0,
    });
    p.tick(1, world);
    expect(a.applyDamage).toHaveBeenCalledOnce();
    expect(b.applyDamage).not.toHaveBeenCalled();
  });

  it('splash skips dead enemies (hp <= 0)', () => {
    const alive = makeEnemy(3, 0);
    const dead = makeEnemy(3, 1, 0);
    const world = makeWorld([alive, dead]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 3,
      damage: 10,
      damageType: 'fire',
      hitRadius: 0.5,
      lifetimeTicks: 5,
      direction: { dx: 1, dy: 0 },
      splashRadius: 5,
    });
    p.tick(1, world);
    expect(alive.applyDamage).toHaveBeenCalledOnce();
    expect(dead.applyDamage).not.toHaveBeenCalled();
  });

  it('splash snapshot: an enemy killed by first applyDamage still receives damage if in radius', () => {
    const a = makeEnemy(3, 0);
    const b = makeEnemy(3, 1);
    a.applyDamage.mockImplementation(() => {
      a.hp = 0;
    });
    const world = makeWorld([a, b]);
    const p = new Projectile({
      x: 0,
      y: 0,
      mode: 'straight',
      speed: 3,
      damage: 10,
      damageType: 'fire',
      hitRadius: 0.5,
      lifetimeTicks: 5,
      direction: { dx: 1, dy: 0 },
      splashRadius: 5,
    });
    p.tick(1, world);
    expect(a.applyDamage).toHaveBeenCalledOnce();
    expect(b.applyDamage).toHaveBeenCalledOnce();
  });
});
