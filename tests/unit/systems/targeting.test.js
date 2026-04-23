import { describe, expect, it } from 'vitest';
import { selectTarget } from '../../../src/systems/targeting.js';

function makeEnemy({ id, x, y, hp, distanceTravelled }) {
  return { id, x, y, hp, distanceTravelled };
}

const tower = { x: 0, y: 0, range: 10 };

describe('range filter', () => {
  it('returns null for empty enemies array for mode first', () => {
    expect(selectTarget(tower, [], 'first')).toBeNull();
  });

  it('returns null for empty enemies array for mode last', () => {
    expect(selectTarget(tower, [], 'last')).toBeNull();
  });

  it('returns null for empty enemies array for mode strongest', () => {
    expect(selectTarget(tower, [], 'strongest')).toBeNull();
  });

  it('returns null for empty enemies array for mode closest', () => {
    expect(selectTarget(tower, [], 'closest')).toBeNull();
  });

  it('returns null for empty enemies array for mode manual', () => {
    expect(selectTarget(tower, [], 'manual', { manualTargetId: 'a' })).toBeNull();
  });

  it('returns null when all enemies out of range', () => {
    const enemies = [makeEnemy({ id: 'a', x: 20, y: 0, hp: 10, distanceTravelled: 50 })];
    expect(selectTarget(tower, enemies, 'first')).toBeNull();
  });

  it('includes enemy exactly at range boundary', () => {
    const onBoundary = makeEnemy({ id: 'a', x: 10, y: 0, hp: 10, distanceTravelled: 5 });
    expect(selectTarget(tower, [onBoundary], 'first')).toBe(onBoundary);
  });
});

describe('first mode', () => {
  it('picks enemy with largest distanceTravelled among in-range', () => {
    const a = makeEnemy({ id: 'a', x: 0, y: 0, hp: 10, distanceTravelled: 10 });
    const b = makeEnemy({ id: 'b', x: 1, y: 0, hp: 10, distanceTravelled: 20 });
    const c = makeEnemy({ id: 'c', x: 2, y: 0, hp: 10, distanceTravelled: 5 });
    expect(selectTarget(tower, [a, b, c], 'first')).toBe(b);
  });

  it('ignores out-of-range enemy even if it has largest distanceTravelled', () => {
    const inRange = makeEnemy({ id: 'a', x: 0, y: 0, hp: 10, distanceTravelled: 15 });
    const outOfRange = makeEnemy({ id: 'b', x: 50, y: 0, hp: 10, distanceTravelled: 100 });
    expect(selectTarget(tower, [inRange, outOfRange], 'first')).toBe(inRange);
  });

  it('stable tiebreak: picks earlier enemy when distanceTravelled is equal', () => {
    const a = makeEnemy({ id: 'a', x: 1, y: 0, hp: 10, distanceTravelled: 30 });
    const b = makeEnemy({ id: 'b', x: 2, y: 0, hp: 10, distanceTravelled: 30 });
    expect(selectTarget(tower, [a, b], 'first')).toBe(a);
  });
});

describe('last mode', () => {
  it('picks enemy with smallest distanceTravelled among in-range', () => {
    const a = makeEnemy({ id: 'a', x: 0, y: 0, hp: 10, distanceTravelled: 10 });
    const b = makeEnemy({ id: 'b', x: 1, y: 0, hp: 10, distanceTravelled: 2 });
    const c = makeEnemy({ id: 'c', x: 2, y: 0, hp: 10, distanceTravelled: 20 });
    expect(selectTarget(tower, [a, b, c], 'last')).toBe(b);
  });

  it('stable tiebreak: picks earlier enemy when distanceTravelled is equal', () => {
    const a = makeEnemy({ id: 'a', x: 1, y: 0, hp: 10, distanceTravelled: 5 });
    const b = makeEnemy({ id: 'b', x: 2, y: 0, hp: 10, distanceTravelled: 5 });
    expect(selectTarget(tower, [a, b], 'last')).toBe(a);
  });
});

describe('strongest mode', () => {
  it('picks enemy with highest current hp among in-range', () => {
    const a = makeEnemy({ id: 'a', x: 0, y: 0, hp: 50, distanceTravelled: 1 });
    const b = makeEnemy({ id: 'b', x: 1, y: 0, hp: 100, distanceTravelled: 1 });
    const c = makeEnemy({ id: 'c', x: 2, y: 0, hp: 30, distanceTravelled: 1 });
    expect(selectTarget(tower, [a, b, c], 'strongest')).toBe(b);
  });

  it('uses current hp not maxHp: damaged tank loses to healthier grunt with higher hp', () => {
    const tank = makeEnemy({ id: 'tank', x: 0, y: 0, hp: 40, distanceTravelled: 1 });
    const grunt = makeEnemy({ id: 'grunt', x: 1, y: 0, hp: 60, distanceTravelled: 1 });
    expect(selectTarget(tower, [tank, grunt], 'strongest')).toBe(grunt);
  });

  it('stable tiebreak: picks earlier enemy when hp is equal', () => {
    const a = makeEnemy({ id: 'a', x: 1, y: 0, hp: 50, distanceTravelled: 1 });
    const b = makeEnemy({ id: 'b', x: 2, y: 0, hp: 50, distanceTravelled: 1 });
    expect(selectTarget(tower, [a, b], 'strongest')).toBe(a);
  });
});

describe('closest mode', () => {
  it('picks enemy with smallest euclidean distance from tower', () => {
    const a = makeEnemy({ id: 'a', x: 8, y: 0, hp: 10, distanceTravelled: 1 });
    const b = makeEnemy({ id: 'b', x: 3, y: 0, hp: 10, distanceTravelled: 1 });
    const c = makeEnemy({ id: 'c', x: 6, y: 0, hp: 10, distanceTravelled: 1 });
    expect(selectTarget(tower, [a, b, c], 'closest')).toBe(b);
  });

  it('range filter excludes out-of-range enemies', () => {
    const tightTower = { x: 0, y: 0, range: 5 };
    const near = makeEnemy({ id: 'near', x: 4, y: 0, hp: 10, distanceTravelled: 1 });
    const far = makeEnemy({ id: 'far', x: 6, y: 0, hp: 10, distanceTravelled: 1 });
    expect(selectTarget(tightTower, [near, far], 'closest')).toBe(near);
  });

  it('stable tiebreak: picks earlier enemy when distance is equal', () => {
    const a = makeEnemy({ id: 'a', x: 3, y: 4, hp: 10, distanceTravelled: 1 });
    const b = makeEnemy({ id: 'b', x: -3, y: 4, hp: 10, distanceTravelled: 1 });
    expect(selectTarget(tower, [a, b], 'closest')).toBe(a);
  });
});

describe('manual mode', () => {
  it('returns enemy whose id matches world.manualTargetId when in range', () => {
    const a = makeEnemy({ id: 'a', x: 1, y: 0, hp: 10, distanceTravelled: 1 });
    const b = makeEnemy({ id: 'b', x: 2, y: 0, hp: 10, distanceTravelled: 1 });
    expect(selectTarget(tower, [a, b], 'manual', { manualTargetId: 'b' })).toBe(b);
  });

  it('returns null when world is omitted', () => {
    const a = makeEnemy({ id: 'a', x: 1, y: 0, hp: 10, distanceTravelled: 1 });
    expect(selectTarget(tower, [a], 'manual')).toBeNull();
  });

  it('returns null when world.manualTargetId is undefined', () => {
    const a = makeEnemy({ id: 'a', x: 1, y: 0, hp: 10, distanceTravelled: 1 });
    expect(selectTarget(tower, [a], 'manual', {})).toBeNull();
  });

  it('returns null when world.manualTargetId is null', () => {
    const a = makeEnemy({ id: 'a', x: 1, y: 0, hp: 10, distanceTravelled: 1 });
    expect(selectTarget(tower, [a], 'manual', { manualTargetId: null })).toBeNull();
  });

  it('returns null when matching enemy is out of range', () => {
    const a = makeEnemy({ id: 'target', x: 50, y: 0, hp: 10, distanceTravelled: 1 });
    expect(selectTarget(tower, [a], 'manual', { manualTargetId: 'target' })).toBeNull();
  });

  it('returns null when no enemy in list has the target id', () => {
    const a = makeEnemy({ id: 'a', x: 1, y: 0, hp: 10, distanceTravelled: 1 });
    expect(selectTarget(tower, [a], 'manual', { manualTargetId: 'missing' })).toBeNull();
  });

  it('does not fall back to another mode when manual cannot resolve', () => {
    const a = makeEnemy({ id: 'a', x: 1, y: 0, hp: 10, distanceTravelled: 100 });
    expect(selectTarget(tower, [a], 'manual', { manualTargetId: 'missing' })).toBeNull();
  });
});
