import { describe, expect, it, vi } from 'vitest';
import { enemies } from '../../../../src/content/enemies/index.js';
import { Enemy } from '../../../../src/entities/logic/Enemy.js';
import { buildPath } from '../../../../src/systems/pathing.js';

const REQUIRED_FIELDS = ['id', 'name', 'hp', 'speed', 'armor', 'flags', 'baseDamage'];

describe('enemies index', () => {
  it('exports exactly 9 archetypes with required fields', () => {
    expect(Object.keys(enemies).length).toBe(9);
    for (const [key, archetype] of Object.entries(enemies)) {
      for (const field of REQUIRED_FIELDS) {
        expect(archetype, `${key} missing ${field}`).toHaveProperty(field);
      }
    }
  });

  it('each archetype constructs an Enemy and advances distanceTravelled on tick', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    const world = { onBaseHit: vi.fn(), onEnemyKilled: vi.fn() };

    for (const archetype of Object.values(enemies)) {
      const enemy = new Enemy({ ...archetype, path });
      enemy.tick(1, world);
      expect(
        enemy.distanceTravelled,
        `${archetype.id} distanceTravelled should be > 0`,
      ).toBeGreaterThan(0);
    }
  });
});
