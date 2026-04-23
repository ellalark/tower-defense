import { describe, expect, it } from 'vitest';
import { buildBuildableMask } from '../../../../src/content/maps/_gridMask.js';

describe('buildBuildableMask', () => {
  it('returns a Uint8Array of length gridCols * gridRows', () => {
    const mask = buildBuildableMask([], { gridCols: 4, gridRows: 3, cellSize: 40 });
    expect(mask).toBeInstanceOf(Uint8Array);
    expect(mask.length).toBe(12);
  });

  it('empty waypoints (length 0) returns all 1s', () => {
    const mask = buildBuildableMask([], { gridCols: 4, gridRows: 3, cellSize: 40 });
    expect([...mask]).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  });

  it('single waypoint (length 1) returns all 1s', () => {
    const mask = buildBuildableMask([{ x: 20, y: 20 }], { gridCols: 4, gridRows: 3, cellSize: 40 });
    expect([...mask]).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  });

  it('horizontal segment at y=20 with buffer=0 blocks row 0 entirely, rows 1-2 buildable', () => {
    const waypoints = [
      { x: 0, y: 20 },
      { x: 160, y: 20 },
    ];
    const mask = buildBuildableMask(waypoints, {
      gridCols: 4,
      gridRows: 3,
      cellSize: 40,
      buffer: 0,
    });
    const row0 = [...mask].slice(0, 4);
    const row1 = [...mask].slice(4, 8);
    const row2 = [...mask].slice(8, 12);
    expect(row0).toEqual([0, 0, 0, 0]);
    expect(row1).toEqual([1, 1, 1, 1]);
    expect(row2).toEqual([1, 1, 1, 1]);
  });

  it('horizontal segment at y=20 with buffer=1 blocks rows 0 and 1, row 2 buildable', () => {
    const waypoints = [
      { x: 0, y: 20 },
      { x: 160, y: 20 },
    ];
    const mask = buildBuildableMask(waypoints, {
      gridCols: 4,
      gridRows: 3,
      cellSize: 40,
      buffer: 1,
    });
    const row0 = [...mask].slice(0, 4);
    const row1 = [...mask].slice(4, 8);
    const row2 = [...mask].slice(8, 12);
    expect(row0).toEqual([0, 0, 0, 0]);
    expect(row1).toEqual([0, 0, 0, 0]);
    expect(row2).toEqual([1, 1, 1, 1]);
  });

  it('L-shape path with buffer=0 blocks exactly cells on each leg', () => {
    const waypoints = [
      { x: 20, y: 20 },
      { x: 100, y: 20 },
      { x: 100, y: 100 },
    ];
    const mask = buildBuildableMask(waypoints, {
      gridCols: 4,
      gridRows: 4,
      cellSize: 40,
      buffer: 0,
    });
    const grid = Array.from({ length: 4 }, (_, r) => [...mask].slice(r * 4, r * 4 + 4));
    expect(grid[0][0]).toBe(0);
    expect(grid[0][1]).toBe(0);
    expect(grid[0][2]).toBe(0);
    expect(grid[0][3]).toBe(1);
    expect(grid[1][0]).toBe(1);
    expect(grid[1][1]).toBe(1);
    expect(grid[1][2]).toBe(0);
    expect(grid[1][3]).toBe(1);
    expect(grid[2][0]).toBe(1);
    expect(grid[2][1]).toBe(1);
    expect(grid[2][2]).toBe(0);
    expect(grid[2][3]).toBe(1);
    expect(grid[3][0]).toBe(1);
    expect(grid[3][1]).toBe(1);
    expect(grid[3][2]).toBe(1);
    expect(grid[3][3]).toBe(1);
  });

  it('waypoints entirely outside the grid are silently ignored', () => {
    const waypoints = [
      { x: 500, y: 500 },
      { x: 800, y: 800 },
    ];
    const mask = buildBuildableMask(waypoints, { gridCols: 4, gridRows: 3, cellSize: 40 });
    expect(mask.length).toBe(12);
    expect([...mask]).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  });
});
