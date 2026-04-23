import { describe, expect, it, vi } from 'vitest';
import { mapBosses } from '../../../../src/content/enemies/index.js';
import { Enemy } from '../../../../src/entities/logic/Enemy.js';
import { buildPath } from '../../../../src/systems/pathing.js';

describe('finalBossMap1', () => {
  it('exists in mapBosses with boss: true', () => {
    expect(mapBosses.finalBossMap1).toBeDefined();
    expect(mapBosses.finalBossMap1.boss).toBe(true);
  });

  it('constructs an Enemy and advances distanceTravelled on tick', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    const world = { onBaseHit: vi.fn(), onEnemyKilled: vi.fn() };
    const enemy = new Enemy({ ...mapBosses.finalBossMap1, path });
    enemy.tick(1, world);
    expect(enemy.distanceTravelled).toBeGreaterThan(0);
  });
});
