import { describe, expect, it, vi } from 'vitest';
import { Enemy } from '../../../../src/entities/logic/Enemy.js';
import { buildPath } from '../../../../src/systems/pathing.js';

function makeWorld() {
  return { onBaseHit: vi.fn(), onEnemyKilled: vi.fn() };
}

const flags = { flying: false, stealth: false, shielded: false };

describe('Enemy', () => {
  it('construction caches initial position', () => {
    const path = buildPath([
      { x: 3, y: 4 },
      { x: 13, y: 4 },
    ]);
    const e = new Enemy({ hp: 10, speed: 2, path, armor: 0, flags, baseDamage: 1 });
    expect(e.x).toBe(3);
    expect(e.y).toBe(4);
    expect(e.distanceTravelled).toBe(0);
  });

  it('moves correctly over multiple ticks', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    const world = makeWorld();
    const e = new Enemy({ hp: 10, speed: 2, path, armor: 0, flags, baseDamage: 1 });
    for (let i = 0; i < 5; i++) e.tick(1, world);
    expect(e.distanceTravelled).toBe(10);
    expect(e.x).toBe(10);
    expect(e.y).toBe(0);
  });

  it('fires onBaseHit when reaching the end and again if not removed', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
    const world = makeWorld();
    const e = new Enemy({ hp: 10, speed: 4, path, armor: 0, flags, baseDamage: 1 });

    e.tick(1, world);
    expect(e.distanceTravelled).toBe(4);
    expect(world.onBaseHit).not.toHaveBeenCalled();

    e.tick(1, world);
    expect(e.distanceTravelled).toBe(8);
    expect(world.onBaseHit).not.toHaveBeenCalled();

    e.tick(1, world);
    expect(e.distanceTravelled).toBe(12);
    expect(world.onBaseHit).toHaveBeenCalledOnce();
    expect(world.onBaseHit).toHaveBeenCalledWith(e);

    e.tick(1, world);
    expect(world.onBaseHit).toHaveBeenCalledTimes(2);
  });

  it('applyDamage reduces hp without killing while hp > 0', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
    const world = makeWorld();
    const e = new Enemy({ hp: 10, speed: 1, path, armor: 0, flags, baseDamage: 1 });
    e.applyDamage(4, 'physical', world);
    expect(e.hp).toBe(6);
    expect(world.onEnemyKilled).not.toHaveBeenCalled();
  });

  it('lethal damage fires onEnemyKilled once with the enemy instance', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
    const world = makeWorld();
    const e = new Enemy({ hp: 5, speed: 1, path, armor: 0, flags, baseDamage: 1 });
    e.applyDamage(5, 'physical', world);
    expect(e.hp).toBe(0);
    expect(world.onEnemyKilled).toHaveBeenCalledOnce();
    expect(world.onEnemyKilled).toHaveBeenCalledWith(e);
  });
});
