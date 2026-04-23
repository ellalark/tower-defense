import { beforeEach, describe, expect, it } from 'vitest';
import { getState, reset } from '../../../src/state/store.js';
import { applyWaveBonus, earn, spend, tickPassive } from '../../../src/systems/economy.js';

beforeEach(() => {
  reset();
});

describe('earn', () => {
  it('increases currency by the given amount', () => {
    earn('kill', 50);
    expect(getState().currency).toBe(50);
  });
});

describe('spend', () => {
  it('returns true and deducts when affordable', () => {
    earn('kill', 100);
    const result = spend(30);
    expect(result).toBe(true);
    expect(getState().currency).toBe(70);
  });

  it('returns false and leaves currency unchanged when overspending', () => {
    earn('kill', 100);
    const result = spend(200);
    expect(result).toBe(false);
    expect(getState().currency).toBe(100);
  });

  it('returns true and leaves currency at 0 on exact boundary', () => {
    earn('kill', 100);
    const result = spend(100);
    expect(result).toBe(true);
    expect(getState().currency).toBe(0);
  });
});

describe('applyWaveBonus', () => {
  it('credits more currency for higher wave numbers (monotonic scaling)', () => {
    applyWaveBonus(1);
    const after1 = getState().currency;

    reset();

    applyWaveBonus(10);
    const after10 = getState().currency;

    expect(after10).toBeGreaterThan(after1);
  });

  it('returns the same amount it credits to currency', () => {
    const returned = applyWaveBonus(5);
    expect(getState().currency).toBe(returned);
  });
});

describe('tickPassive', () => {
  it('credits the sum of all pendingEarn values and zeroes the fields', () => {
    const towers = [{ pendingEarn: 25 }, { pendingEarn: 10 }, {}];
    const credited = tickPassive(towers);
    expect(credited).toBe(35);
    expect(getState().currency).toBe(35);
    expect(towers[0].pendingEarn).toBe(0);
    expect(towers[1].pendingEarn).toBe(0);
  });

  it('is idempotent: second call with no new pendingEarn credits 0', () => {
    const towers = [{ pendingEarn: 25 }, { pendingEarn: 10 }, {}];
    tickPassive(towers);
    const secondCredited = tickPassive(towers);
    expect(secondCredited).toBe(0);
    expect(getState().currency).toBe(35);
  });

  it('credits 0 and does not mutate state when towers array is empty', () => {
    const credited = tickPassive([]);
    expect(credited).toBe(0);
    expect(getState().currency).toBe(0);
  });
});
