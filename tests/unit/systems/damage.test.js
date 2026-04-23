import { describe, expect, it, vi } from 'vitest';
import { Enemy } from '../../../src/entities/logic/Enemy.js';
import { applyBurn, applySlow, applyStun, resolveDamage } from '../../../src/systems/damage.js';
import { buildPath } from '../../../src/systems/pathing.js';

function makeWorld() {
  return { onBaseHit: vi.fn(), onEnemyKilled: vi.fn() };
}

function makeEnemy(speed = 10) {
  const path = buildPath([
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
  ]);
  return new Enemy({
    hp: 100,
    speed,
    path,
    armor: 0,
    flags: { flying: false, stealth: false, shielded: false },
    baseDamage: 1,
  });
}

describe('applySlow', () => {
  it('pushes a SlowEffect onto enemy.effects when none present', () => {
    const enemy = makeEnemy();
    applySlow(enemy, { durationTicks: 5, factor: 0.5 });
    expect(enemy.effects).toHaveLength(1);
    expect(enemy.effects[0].type).toBe('slow');
    expect(enemy.effects[0].factor).toBe(0.5);
    expect(enemy.effects[0].durationTicks).toBe(5);
  });

  it('stronger slow (lower factor) replaces factor and refreshes duration', () => {
    const enemy = makeEnemy();
    applySlow(enemy, { durationTicks: 5, factor: 0.5 });
    applySlow(enemy, { durationTicks: 8, factor: 0.3 });
    expect(enemy.effects).toHaveLength(1);
    expect(enemy.effects[0].factor).toBe(0.3);
    expect(enemy.effects[0].durationTicks).toBe(8);
  });

  it('weaker slow (higher factor) keeps existing factor but refreshes duration', () => {
    const enemy = makeEnemy();
    applySlow(enemy, { durationTicks: 5, factor: 0.3 });
    applySlow(enemy, { durationTicks: 8, factor: 0.6 });
    expect(enemy.effects).toHaveLength(1);
    expect(enemy.effects[0].factor).toBe(0.3);
    expect(enemy.effects[0].durationTicks).toBe(8);
  });

  it('equal factor slow refreshes duration', () => {
    const enemy = makeEnemy();
    applySlow(enemy, { durationTicks: 3, factor: 0.5 });
    applySlow(enemy, { durationTicks: 10, factor: 0.5 });
    expect(enemy.effects).toHaveLength(1);
    expect(enemy.effects[0].factor).toBe(0.5);
    expect(enemy.effects[0].durationTicks).toBe(10);
  });
});

describe('applyStun', () => {
  it('pushes a StunEffect onto enemy.effects when none present', () => {
    const enemy = makeEnemy();
    applyStun(enemy, { durationTicks: 3 });
    expect(enemy.effects).toHaveLength(1);
    expect(enemy.effects[0].type).toBe('stun');
    expect(enemy.effects[0].durationTicks).toBe(3);
  });

  it('stacking stun refreshes duration', () => {
    const enemy = makeEnemy();
    applyStun(enemy, { durationTicks: 3 });
    applyStun(enemy, { durationTicks: 7 });
    expect(enemy.effects).toHaveLength(1);
    expect(enemy.effects[0].durationTicks).toBe(7);
  });
});

describe('applyBurn', () => {
  it('pushes a BurnEffect onto enemy.effects when none present', () => {
    const enemy = makeEnemy();
    applyBurn(enemy, { durationTicks: 4, dps: 5 });
    expect(enemy.effects).toHaveLength(1);
    expect(enemy.effects[0].type).toBe('burn');
    expect(enemy.effects[0].dps).toBe(5);
    expect(enemy.effects[0].durationTicks).toBe(4);
  });

  it('stronger burn (higher dps) replaces dps and refreshes duration', () => {
    const enemy = makeEnemy();
    applyBurn(enemy, { durationTicks: 4, dps: 5 });
    applyBurn(enemy, { durationTicks: 6, dps: 10 });
    expect(enemy.effects).toHaveLength(1);
    expect(enemy.effects[0].dps).toBe(10);
    expect(enemy.effects[0].durationTicks).toBe(6);
  });

  it('weaker burn (lower dps) keeps existing dps but refreshes duration', () => {
    const enemy = makeEnemy();
    applyBurn(enemy, { durationTicks: 4, dps: 10 });
    applyBurn(enemy, { durationTicks: 6, dps: 3 });
    expect(enemy.effects).toHaveLength(1);
    expect(enemy.effects[0].dps).toBe(10);
    expect(enemy.effects[0].durationTicks).toBe(6);
  });
});

describe('cross-type coexistence', () => {
  it('slow, stun, burn all coexist on the same enemy', () => {
    const enemy = makeEnemy();
    applySlow(enemy, { durationTicks: 5, factor: 0.5 });
    applyStun(enemy, { durationTicks: 3 });
    applyBurn(enemy, { durationTicks: 4, dps: 5 });
    expect(enemy.effects).toHaveLength(3);
    const types = enemy.effects.map((e) => e.type);
    expect(types).toContain('slow');
    expect(types).toContain('stun');
    expect(types).toContain('burn');
  });

  it('second slow does not affect stun or burn', () => {
    const enemy = makeEnemy();
    applySlow(enemy, { durationTicks: 5, factor: 0.5 });
    applyStun(enemy, { durationTicks: 3 });
    applyBurn(enemy, { durationTicks: 4, dps: 5 });
    applySlow(enemy, { durationTicks: 8, factor: 0.2 });
    expect(enemy.effects).toHaveLength(3);
    const slow = enemy.effects.find((e) => e.type === 'slow');
    expect(slow.factor).toBe(0.2);
    expect(slow.durationTicks).toBe(8);
  });
});

describe('Enemy.tick integration with status effects', () => {
  it('slow reduces distanceTravelled each tick', () => {
    const world = makeWorld();
    const enemy = makeEnemy(10);
    applySlow(enemy, { durationTicks: 5, factor: 0.5 });
    enemy.tick(1, world);
    expect(enemy.distanceTravelled).toBe(5);
  });

  it('stun halts movement', () => {
    const world = makeWorld();
    const enemy = makeEnemy(10);
    applyStun(enemy, { durationTicks: 3 });
    enemy.tick(1, world);
    expect(enemy.distanceTravelled).toBe(0);
  });

  it('burn ticks damage each tick and stops after expiry', () => {
    const world = makeWorld();
    const enemy = makeEnemy(0);
    applyBurn(enemy, { durationTicks: 3, dps: 5 });
    enemy.tick(1, world);
    expect(enemy.hp).toBe(95);
    enemy.tick(1, world);
    expect(enemy.hp).toBe(90);
    enemy.tick(1, world);
    expect(enemy.hp).toBe(85);
    enemy.tick(1, world);
    expect(enemy.hp).toBe(85);
  });

  it('burn continues during stun', () => {
    const world = makeWorld();
    const enemy = makeEnemy(10);
    applyStun(enemy, { durationTicks: 2 });
    applyBurn(enemy, { durationTicks: 2, dps: 5 });
    enemy.tick(1, world);
    expect(enemy.distanceTravelled).toBe(0);
    expect(enemy.hp).toBe(95);
  });

  it('effect with durationTicks=1 fires exactly once then is pruned', () => {
    const world = makeWorld();
    const enemy = makeEnemy(0);
    applyBurn(enemy, { durationTicks: 1, dps: 10 });
    enemy.tick(1, world);
    expect(enemy.hp).toBe(90);
    expect(enemy.effects).toHaveLength(0);
    enemy.tick(1, world);
    expect(enemy.hp).toBe(90);
  });

  it('enemy killed by burn does not move or trigger onBaseHit that tick', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
    const world = makeWorld();
    const enemy = new Enemy({
      hp: 5,
      speed: 10,
      path,
      armor: 0,
      flags: { flying: false, stealth: false, shielded: false },
      baseDamage: 1,
    });
    applyBurn(enemy, { durationTicks: 1, dps: 10 });
    enemy.tick(1, world);
    expect(world.onEnemyKilled).toHaveBeenCalledOnce();
    expect(world.onBaseHit).not.toHaveBeenCalled();
    expect(enemy.distanceTravelled).toBe(0);
  });

  it('slow effect expires and full speed resumes', () => {
    const world = makeWorld();
    const enemy = makeEnemy(10);
    applySlow(enemy, { durationTicks: 1, factor: 0.5 });
    enemy.tick(1, world);
    expect(enemy.distanceTravelled).toBe(5);
    enemy.tick(1, world);
    expect(enemy.distanceTravelled).toBe(15);
  });
});

describe('resolveDamage', () => {
  it('singleTargetDps vs tank → 1.5x', () => {
    expect(
      resolveDamage({ amount: 100, type: 'singleTargetDps', enemy: { archetype: 'tank' } }),
    ).toBe(150);
  });

  it('singleTargetDps vs boss → 1.5x', () => {
    expect(
      resolveDamage({ amount: 100, type: 'singleTargetDps', enemy: { archetype: 'boss' } }),
    ).toBe(150);
  });

  it('singleTargetDps vs fast → 0.7x', () => {
    expect(
      resolveDamage({ amount: 100, type: 'singleTargetDps', enemy: { archetype: 'fast' } }),
    ).toBe(70);
  });

  it('splash vs grunt → 1.5x', () => {
    expect(resolveDamage({ amount: 100, type: 'splash', enemy: { archetype: 'grunt' } })).toBe(150);
  });

  it('splash vs fast → 1.5x', () => {
    expect(resolveDamage({ amount: 100, type: 'splash', enemy: { archetype: 'fast' } })).toBe(150);
  });

  it('splash vs tank → 0.7x', () => {
    expect(resolveDamage({ amount: 100, type: 'splash', enemy: { archetype: 'tank' } })).toBe(70);
  });

  it('chain vs fast → 1.5x', () => {
    expect(resolveDamage({ amount: 100, type: 'chain', enemy: { archetype: 'fast' } })).toBe(150);
  });

  it('chain vs grunt → 1.5x', () => {
    expect(resolveDamage({ amount: 100, type: 'chain', enemy: { archetype: 'grunt' } })).toBe(150);
  });

  it('chain vs tank → 0.7x', () => {
    expect(resolveDamage({ amount: 100, type: 'chain', enemy: { archetype: 'tank' } })).toBe(70);
  });

  it('chain vs boss → 0.7x', () => {
    expect(resolveDamage({ amount: 100, type: 'chain', enemy: { archetype: 'boss' } })).toBe(70);
  });

  it('pass-through — known tower vs unknown archetype', () => {
    expect(
      resolveDamage({ amount: 100, type: 'singleTargetDps', enemy: { archetype: 'flying' } }),
    ).toBe(100);
  });

  it('pass-through — slow vs any archetype', () => {
    expect(resolveDamage({ amount: 100, type: 'slow', enemy: { archetype: 'tank' } })).toBe(100);
  });

  it('pass-through — support vs any archetype', () => {
    expect(resolveDamage({ amount: 100, type: 'support', enemy: { archetype: 'grunt' } })).toBe(
      100,
    );
  });

  it('pass-through — economy vs any archetype', () => {
    expect(resolveDamage({ amount: 100, type: 'economy', enemy: { archetype: 'boss' } })).toBe(100);
  });

  it('pass-through — unknown tower type', () => {
    expect(resolveDamage({ amount: 100, type: 'unknown', enemy: { archetype: 'tank' } })).toBe(100);
  });

  it('never zero for positive input across all matchups', () => {
    const towerTypes = ['singleTargetDps', 'splash', 'slow', 'chain', 'support', 'economy'];
    const archetypes = [
      'grunt',
      'tank',
      'fast',
      'flying',
      'shielded',
      'stealth',
      'splitter',
      'healer',
      'boss',
    ];
    for (const type of towerTypes) {
      for (const archetype of archetypes) {
        const result = resolveDamage({ amount: 1, type, enemy: { archetype } });
        expect(result, `${type} vs ${archetype}`).toBeGreaterThan(0);
      }
    }
  });

  it('zero amount stays zero', () => {
    expect(
      resolveDamage({ amount: 0, type: 'singleTargetDps', enemy: { archetype: 'tank' } }),
    ).toBe(0);
  });
});
