import { describe, expect, it, vi } from 'vitest';
import { Tower } from '../../../../src/entities/logic/Tower.js';

const def = {
  id: 'test-dps',
  name: 'Test DPS',
  archetype: 'singleTargetDps',
  placementCost: 100,
  levels: [
    { damage: 10, range: 200, cooldownTicks: 60 },
    { damage: 20, range: 220, cooldownTicks: 50, upgradeCost: 200 },
    { damage: 40, range: 240, cooldownTicks: 40, upgradeCost: 400 },
  ],
  fire: vi.fn(),
  ability: {
    cooldownTicks: 600,
    execute: vi.fn(),
  },
};

function makeEnemy(opts = {}) {
  return {
    x: opts.x ?? 100,
    y: opts.y ?? 0,
    hp: opts.hp ?? 10,
    distanceTravelled: opts.distanceTravelled ?? 0,
    flags: { flying: false, stealth: false, shielded: false },
  };
}

function makeWorld(opts = {}) {
  return {
    enemies: opts.enemies ?? [],
    spend: opts.spend ?? vi.fn(() => true),
  };
}

describe('Tower', () => {
  describe('firing cadence', () => {
    it('fires on the first tick when a target is in range', () => {
      const fire = vi.fn();
      const tower = new Tower({ def: { ...def, fire }, x: 0, y: 0 });
      const enemy = makeEnemy({ x: 100, y: 0 });
      const world = makeWorld({ enemies: [enemy] });

      tower.tick(1, world);

      expect(fire).toHaveBeenCalledOnce();
      expect(fire).toHaveBeenCalledWith(world, tower, enemy);
    });

    it('does not fire again until cooldownTicks have elapsed', () => {
      const fire = vi.fn();
      const tower = new Tower({ def: { ...def, fire }, x: 0, y: 0 });
      const enemy = makeEnemy({ x: 100, y: 0 });
      const world = makeWorld({ enemies: [enemy] });

      tower.tick(1, world);
      expect(fire).toHaveBeenCalledTimes(1);

      tower.tick(1, world);
      tower.tick(1, world);
      expect(fire).toHaveBeenCalledTimes(1);
    });

    it('fires again exactly on the tick cooldown reaches 0', () => {
      const fire = vi.fn();
      const tower = new Tower({ def: { ...def, fire }, x: 0, y: 0 });
      const enemy = makeEnemy({ x: 100, y: 0 });
      const world = makeWorld({ enemies: [enemy] });

      tower.tick(1, world);
      expect(fire).toHaveBeenCalledTimes(1);

      for (let i = 0; i < 59; i++) tower.tick(1, world);
      expect(fire).toHaveBeenCalledTimes(1);

      tower.tick(1, world);
      expect(fire).toHaveBeenCalledTimes(2);
    });

    it('does not fire when selectTarget returns null', () => {
      const fire = vi.fn();
      const tower = new Tower({ def: { ...def, fire }, x: 0, y: 0 });
      const world = makeWorld({ enemies: [] });

      tower.tick(1, world);
      tower.tick(1, world);

      expect(fire).not.toHaveBeenCalled();
    });

    it('passes tower, enemies, targetingMode, and world to selectTarget', () => {
      const fire = vi.fn();
      const tower = new Tower({ def: { ...def, fire }, x: 0, y: 0, targetingMode: 'last' });
      const closer = makeEnemy({ x: 50, y: 0, distanceTravelled: 50 });
      const farther = makeEnemy({ x: 100, y: 0, distanceTravelled: 100 });
      const world = makeWorld({ enemies: [closer, farther] });

      tower.tick(1, world);

      expect(fire).toHaveBeenCalledWith(world, tower, closer);
    });
  });

  describe('upgrade', () => {
    it('increments level and reflects new stats when spend succeeds', () => {
      const spend = vi.fn(() => true);
      const tower = new Tower({ def, x: 0, y: 0 });
      const world = makeWorld({ spend });

      const result = tower.upgrade(world);

      expect(result).toBe(true);
      expect(tower.level).toBe(2);
      expect(tower.damage).toBe(20);
      expect(tower.range).toBe(220);
      expect(tower.cooldownTicks).toBe(50);
    });

    it('calls spend with the destination level upgradeCost', () => {
      const spend = vi.fn(() => true);
      const tower = new Tower({ def, x: 0, y: 0 });
      const world = makeWorld({ spend });

      tower.upgrade(world);

      expect(spend).toHaveBeenCalledWith(200);
    });

    it('leaves level unchanged and returns false when spend fails', () => {
      const spend = vi.fn(() => false);
      const tower = new Tower({ def, x: 0, y: 0 });
      const world = makeWorld({ spend });

      const result = tower.upgrade(world);

      expect(result).toBe(false);
      expect(tower.level).toBe(1);
    });

    it('returns false without calling spend when already at max level', () => {
      const spend = vi.fn(() => true);
      const tower = new Tower({ def, x: 0, y: 0 });
      const world = makeWorld({ spend });

      tower.upgrade(world);
      tower.upgrade(world);
      spend.mockClear();

      const result = tower.upgrade(world);

      expect(result).toBe(false);
      expect(spend).not.toHaveBeenCalled();
      expect(tower.level).toBe(3);
    });
  });

  describe('ability', () => {
    it('canActivate returns true initially; activate calls execute, sets cooldown, returns true', () => {
      const execute = vi.fn();
      const rng = {};
      const tower = new Tower({
        def: { ...def, ability: { cooldownTicks: 600, execute } },
        x: 0,
        y: 0,
      });
      const world = makeWorld();

      expect(tower.canActivate()).toBe(true);

      const result = tower.activate(rng, world);

      expect(result).toBe(true);
      expect(execute).toHaveBeenCalledWith(rng, world, tower);
      expect(tower.abilityCooldownRemaining).toBe(600);
    });

    it('canActivate is false and activate returns false while cooldown > 0', () => {
      const execute = vi.fn();
      const tower = new Tower({
        def: { ...def, ability: { cooldownTicks: 600, execute } },
        x: 0,
        y: 0,
      });
      const world = makeWorld();

      tower.activate({}, world);
      execute.mockClear();

      expect(tower.canActivate()).toBe(false);
      const result = tower.activate({}, world);
      expect(result).toBe(false);
      expect(execute).not.toHaveBeenCalled();
    });

    it('ability becomes activatable again after cooldownTicks ticks', () => {
      const execute = vi.fn();
      const tower = new Tower({
        def: { ...def, ability: { cooldownTicks: 600, execute } },
        x: 0,
        y: 0,
      });
      const world = makeWorld({ enemies: [] });

      tower.activate({}, world);

      for (let i = 0; i < 599; i++) tower.tick(1, world);
      expect(tower.canActivate()).toBe(false);

      tower.tick(1, world);
      expect(tower.canActivate()).toBe(true);
    });

    it('canActivate returns false and activate returns false when def.ability is absent', () => {
      const execute = vi.fn();
      const tower = new Tower({ def: { ...def, ability: null }, x: 0, y: 0 });
      const world = makeWorld();

      expect(tower.canActivate()).toBe(false);
      const result = tower.activate({}, world);
      expect(result).toBe(false);
      expect(execute).not.toHaveBeenCalled();
    });
  });
});
