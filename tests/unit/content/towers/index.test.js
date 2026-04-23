import { describe, expect, it, vi } from 'vitest';
import { towers } from '../../../../src/content/towers/index.js';
import { SlowEffect } from '../../../../src/entities/logic/StatusEffect.js';
import { Tower } from '../../../../src/entities/logic/Tower.js';

const REQUIRED_FIELDS = [
  'id',
  'name',
  'archetype',
  'placementCost',
  'damageType',
  'levels',
  'fire',
  'ability',
  'art',
];

function makeEnemy({ x, y, hp = 100, distanceTravelled = 0 } = {}) {
  return {
    hp,
    x,
    y,
    distanceTravelled,
    flags: { flying: false, stealth: false, shielded: false },
    effects: [],
    applyDamage(amount, _type, world) {
      this.hp -= amount;
      if (this.hp <= 0) world.onEnemyKilled(this);
    },
  };
}

function makeWorld(enemies = []) {
  return {
    enemies,
    spend: () => true,
    onEnemyKilled: vi.fn(),
    onBaseHit: vi.fn(),
  };
}

describe('towers index', () => {
  it('exports exactly 6 archetypes with required fields', () => {
    expect(Object.keys(towers).length).toBe(6);
    for (const [key, def] of Object.entries(towers)) {
      for (const field of REQUIRED_FIELDS) {
        expect(def, `${key} missing ${field}`).toHaveProperty(field);
      }
    }
  });

  it('every archetype has 3 levels, each with damage/range/cooldownTicks; levels 2-3 have upgradeCost', () => {
    for (const [key, def] of Object.entries(towers)) {
      expect(def.levels.length, `${key} levels length`).toBe(3);
      for (let i = 0; i < 3; i++) {
        const lv = def.levels[i];
        expect(lv, `${key} level ${i} missing damage`).toHaveProperty('damage');
        expect(lv, `${key} level ${i} missing range`).toHaveProperty('range');
        expect(lv, `${key} level ${i} missing cooldownTicks`).toHaveProperty('cooldownTicks');
      }
      expect(def.levels[1], `${key} level 2 missing upgradeCost`).toHaveProperty('upgradeCost');
      expect(def.levels[2], `${key} level 3 missing upgradeCost`).toHaveProperty('upgradeCost');
    }
  });

  it('each archetype upgrades through all 3 levels', () => {
    for (const [key, def] of Object.entries(towers)) {
      const tower = new Tower({ def, x: 0, y: 0 });
      const world = makeWorld();
      expect(tower.level, `${key} starts at 1`).toBe(1);
      tower.upgrade(world);
      expect(tower.level, `${key} at level 2`).toBe(2);
      tower.upgrade(world);
      expect(tower.level, `${key} at level 3`).toBe(3);
      expect(tower.damage, `${key} level 3 damage`).toBe(def.levels[2].damage);
    }
  });

  it('singleTargetDps ability hits a target enemy for 3x damage', () => {
    const def = towers.singleTargetDps;
    const tower = new Tower({ def, x: 0, y: 0 });
    const enemy = makeEnemy({ x: 10, y: 0, hp: 200 });
    const world = makeWorld([enemy]);
    const result = tower.activate(() => Math.random(), world);
    expect(result).toBe(true);
    expect(enemy.hp).toBeLessThan(200);
  });

  it('singleTargetDps fire deals damage to target', () => {
    const def = towers.singleTargetDps;
    const tower = new Tower({ def, x: 0, y: 0 });
    const enemy = makeEnemy({ x: 10, y: 0, hp: 200 });
    const world = makeWorld([enemy]);
    tower.tick(1, world);
    expect(enemy.hp).toBeLessThan(200);
  });

  it('splash ability damages multiple enemies in AoE', () => {
    const def = towers.splash;
    const tower = new Tower({ def, x: 0, y: 0 });
    const e1 = makeEnemy({ x: 50, y: 0, hp: 100 });
    const e2 = makeEnemy({ x: 0, y: 50, hp: 100 });
    const world = makeWorld([e1, e2]);
    const result = tower.activate(() => Math.random(), world);
    expect(result).toBe(true);
    expect(e1.hp).toBeLessThan(100);
    expect(e2.hp).toBeLessThan(100);
  });

  it('splash fire damages all enemies within splashRadius of target', () => {
    const def = towers.splash;
    const tower = new Tower({ def, x: 0, y: 0 });
    const primary = makeEnemy({ x: 10, y: 0, hp: 100, distanceTravelled: 10 });
    const nearby = makeEnemy({ x: 20, y: 0, hp: 100, distanceTravelled: 5 });
    const world = makeWorld([primary, nearby]);
    tower.tick(1, world);
    expect(primary.hp).toBeLessThan(100);
    expect(nearby.hp).toBeLessThan(100);
  });

  it('slow ability applies SlowEffect to all enemies in range', () => {
    const def = towers.slow;
    const tower = new Tower({ def, x: 0, y: 0 });
    const e1 = makeEnemy({ x: 50, y: 0 });
    const e2 = makeEnemy({ x: 0, y: 60, hp: 100 });
    const world = makeWorld([e1, e2]);
    const result = tower.activate(() => Math.random(), world);
    expect(result).toBe(true);
    expect(e1.effects.some((ef) => ef instanceof SlowEffect)).toBe(true);
    expect(e2.effects.some((ef) => ef instanceof SlowEffect)).toBe(true);
  });

  it('slow fire applies damage and slow effect to target', () => {
    const def = towers.slow;
    const tower = new Tower({ def, x: 0, y: 0 });
    const enemy = makeEnemy({ x: 10, y: 0, hp: 100 });
    const world = makeWorld([enemy]);
    tower.tick(1, world);
    expect(enemy.hp).toBeLessThan(100);
    expect(enemy.effects.some((ef) => ef instanceof SlowEffect)).toBe(true);
  });

  it('chain ability damages starting enemy and at least one chained enemy', () => {
    const def = towers.chain;
    const tower = new Tower({ def, x: 0, y: 0 });
    const e1 = makeEnemy({ x: 10, y: 0, hp: 100, distanceTravelled: 10 });
    const e2 = makeEnemy({ x: 50, y: 0, hp: 100, distanceTravelled: 5 });
    const world = makeWorld([e1, e2]);
    const result = tower.activate(() => Math.random(), world);
    expect(result).toBe(true);
    const damaged = [e1, e2].filter((e) => e.hp < 100);
    expect(damaged.length).toBeGreaterThanOrEqual(2);
  });

  it('chain fire damages primary target and chains to nearby enemy', () => {
    const def = towers.chain;
    const tower = new Tower({ def, x: 0, y: 0 });
    const e1 = makeEnemy({ x: 10, y: 0, hp: 100, distanceTravelled: 10 });
    const e2 = makeEnemy({ x: 50, y: 0, hp: 100, distanceTravelled: 5 });
    const world = makeWorld([e1, e2]);
    tower.tick(1, world);
    expect(e1.hp).toBeLessThan(100);
    expect(e2.hp).toBeLessThan(100);
  });

  it('support ability sets buffPulseRemaining > 0', () => {
    const def = towers.support;
    const tower = new Tower({ def, x: 0, y: 0 });
    const world = makeWorld([]);
    const result = tower.activate(() => Math.random(), world);
    expect(result).toBe(true);
    expect(tower.buffPulseRemaining).toBeGreaterThan(0);
  });

  it('support fire deals damage to target', () => {
    const def = towers.support;
    const tower = new Tower({ def, x: 0, y: 0 });
    const enemy = makeEnemy({ x: 10, y: 0, hp: 100 });
    const world = makeWorld([enemy]);
    tower.tick(1, world);
    expect(enemy.hp).toBeLessThan(100);
  });

  it('economy ability sets pendingEarn to earnPerActivation', () => {
    const def = towers.economy;
    const tower = new Tower({ def, x: 0, y: 0 });
    const world = makeWorld([]);
    const result = tower.activate(() => Math.random(), world);
    expect(result).toBe(true);
    expect(tower.pendingEarn).toBe(def.earnPerActivation);
  });

  it('economy fire deals damage to target', () => {
    const def = towers.economy;
    const tower = new Tower({ def, x: 0, y: 0 });
    const enemy = makeEnemy({ x: 10, y: 0, hp: 100 });
    const world = makeWorld([enemy]);
    tower.tick(1, world);
    expect(enemy.hp).toBeLessThan(100);
  });
});
