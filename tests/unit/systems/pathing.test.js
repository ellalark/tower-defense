import { describe, expect, it } from 'vitest';
import { buildPath, pointAtDistance } from '../../../src/systems/pathing.js';

describe('buildPath', () => {
  it('straight 2-point path has correct segment length and totalLength', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 3, y: 4 },
    ]);
    expect(path.segments).toHaveLength(1);
    expect(path.segments[0].length).toBeCloseTo(5);
    expect(path.totalLength).toBeCloseTo(5);
  });

  it('straight 2-point path segment has correct dx and dy', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 3, y: 4 },
    ]);
    expect(path.segments[0].dx).toBe(3);
    expect(path.segments[0].dy).toBe(4);
  });

  it('L-shape 3-point path has 2 segments and correct totalLength', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(path.segments).toHaveLength(2);
    expect(path.segments[0].length).toBeCloseTo(100);
    expect(path.segments[1].length).toBeCloseTo(100);
    expect(path.totalLength).toBeCloseTo(200);
  });

  it('4-point path has 3 segments with correct totalLength', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]);
    expect(path.segments).toHaveLength(3);
    expect(path.totalLength).toBeCloseTo(30);
  });

  it('empty array returns empty shape', () => {
    const path = buildPath([]);
    expect(path.waypoints).toEqual([]);
    expect(path.segments).toEqual([]);
    expect(path.totalLength).toBe(0);
  });

  it('single waypoint returns 0 segments and totalLength 0', () => {
    const path = buildPath([{ x: 5, y: 7 }]);
    expect(path.waypoints).toHaveLength(1);
    expect(path.segments).toHaveLength(0);
    expect(path.totalLength).toBe(0);
  });

  it('duplicate consecutive waypoints produce a zero-length segment without throwing', () => {
    const path = buildPath([
      { x: 1, y: 1 },
      { x: 1, y: 1 },
      { x: 5, y: 1 },
    ]);
    expect(path.segments).toHaveLength(2);
    expect(path.segments[0].length).toBe(0);
    expect(path.segments[1].length).toBeCloseTo(4);
    expect(path.totalLength).toBeCloseTo(4);
  });

  it('returned waypoints match the input', () => {
    const wp = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    const path = buildPath(wp);
    expect(path.waypoints).toEqual(wp);
  });
});

describe('pointAtDistance', () => {
  it('d = 0 returns first waypoint with segmentIndex 0', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
    const p = pointAtDistance(path, 0);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
    expect(p.segmentIndex).toBe(0);
  });

  it('midpoint of a straight segment returns correct x, y and segmentIndex 0', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
    const p = pointAtDistance(path, 5);
    expect(p.x).toBeCloseTo(5);
    expect(p.y).toBeCloseTo(0);
    expect(p.segmentIndex).toBe(0);
  });

  it('d = totalLength returns last waypoint on final segment', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
    const p = pointAtDistance(path, 10);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(0);
    expect(p.segmentIndex).toBe(0);
  });

  it('d < 0 clamps to first waypoint with segmentIndex 0', () => {
    const path = buildPath([
      { x: 3, y: 7 },
      { x: 13, y: 7 },
    ]);
    const p = pointAtDistance(path, -5);
    expect(p.x).toBeCloseTo(3);
    expect(p.y).toBeCloseTo(7);
    expect(p.segmentIndex).toBe(0);
  });

  it('d > totalLength clamps to last waypoint with segmentIndex = last', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
    const p = pointAtDistance(path, 999);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(0);
    expect(p.segmentIndex).toBe(0);
  });

  it('d exactly at segment boundary (multi-segment) reports next segment index', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]);
    const p = pointAtDistance(path, 10);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(0);
    expect(p.segmentIndex).toBe(1);
  });

  it('L-shape: point past the corner lands on the second segment with correct coords', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]);
    const p = pointAtDistance(path, 150);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(50);
    expect(p.segmentIndex).toBe(1);
  });

  it('degenerate empty path returns {x:0,y:0,segmentIndex:0} without throwing', () => {
    const path = buildPath([]);
    const p = pointAtDistance(path, 5);
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
    expect(p.segmentIndex).toBe(0);
  });

  it('degenerate single-point path returns that point for any d', () => {
    const path = buildPath([{ x: 4, y: 9 }]);
    const p = pointAtDistance(path, 100);
    expect(p.x).toBeCloseTo(4);
    expect(p.y).toBeCloseTo(9);
    expect(p.segmentIndex).toBe(0);
  });

  it('d === totalLength on multi-segment path pins to final segment', () => {
    const path = buildPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]);
    const p = pointAtDistance(path, 20);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(10);
    expect(p.segmentIndex).toBe(1);
  });
});
