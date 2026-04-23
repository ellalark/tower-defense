import { beforeEach, describe, expect, test, vi } from 'vitest';
import { BASE_HP_DEFAULT } from '../../../src/config/constants.js';
import { getState, reset, setState, subscribe } from '../../../src/state/store.js';

beforeEach(() => {
  reset();
});

describe('store', () => {
  test('default shape has all keys with correct defaults', () => {
    const s = getState();
    expect(s.currentWave).toBe(0);
    expect(s.currency).toBe(0);
    expect(s.baseHp).toBe(BASE_HP_DEFAULT);
    expect(s.runSeed).toBeNull();
    expect(s.towers).toEqual([]);
    expect(s.enemies).toEqual([]);
    expect(s.projectiles).toEqual([]);
    expect(s.paused).toBe(false);
    expect(s.speedMultiplier).toBe(1);
    expect(s.uiMode).toBe('menu');
    expect(s.tutorialStep).toBeNull();
    expect(s.manualTargetId).toBeNull();
  });

  test('setState shallow merge leaves untouched keys intact', () => {
    setState({ currency: 100 });
    const s = getState();
    expect(s.currency).toBe(100);
    expect(s.currentWave).toBe(0);
  });

  test('setState replaces nested objects wholesale, not deep-merges', () => {
    setState({ settings: { volume: 0.5 } });
    setState({ settings: { muted: true } });
    expect(getState().settings).toEqual({ muted: true });
  });

  test('subscribe fires with (newState, prevState) on change', () => {
    let args;
    const unsub = subscribe((newState, prevState) => {
      args = { newState, prevState };
    });
    setState({ currency: 50 });
    expect(args).toBeDefined();
    expect(args.newState.currency).toBe(50);
    expect(args.prevState.currency).toBe(0);
    expect(args.newState).not.toBe(args.prevState);
    unsub();
  });

  test('subscribe does NOT fire on initial subscribe', () => {
    const spy = vi.fn();
    const unsub = subscribe(spy);
    expect(spy).not.toHaveBeenCalled();
    unsub();
  });

  test('unsubscribe prevents future firings', () => {
    const spy = vi.fn();
    const unsub = subscribe(spy);
    setState({ currency: 1 });
    unsub();
    setState({ currency: 2 });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('unsubscribe is idempotent', () => {
    const spy = vi.fn();
    const unsub = subscribe(spy);
    unsub();
    expect(() => unsub()).not.toThrow();
    setState({ currency: 1 });
    expect(spy).not.toHaveBeenCalled();
  });

  test('multiple subscribers fire in registration order', () => {
    const order = [];
    const unsub1 = subscribe(() => order.push(1));
    const unsub2 = subscribe(() => order.push(2));
    const unsub3 = subscribe(() => order.push(3));
    setState({ currency: 1 });
    expect(order).toEqual([1, 2, 3]);
    unsub1();
    unsub2();
    unsub3();
  });

  test('setState always fires even for no-op merges, new state object each time', () => {
    const spy = vi.fn();
    const unsub = subscribe(spy);
    setState({});
    expect(spy).toHaveBeenCalledOnce();
    const [newState, prevState] = spy.mock.calls[0];
    expect(newState).not.toBe(prevState);
    unsub();
  });

  test('throwing listener logs error and siblings still fire', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const results = [];
    const unsub1 = subscribe(() => {
      throw new Error('boom');
    });
    const unsub2 = subscribe(() => results.push('ok'));
    setState({ currency: 1 });
    expect(results).toEqual(['ok']);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
    unsub1();
    unsub2();
  });

  test('reset restores full shape and fires subscribers with (defaultState, prevState)', () => {
    setState({ currency: 500, foo: 'extra' });
    const spy = vi.fn();
    const unsub = subscribe(spy);
    reset();
    expect(getState().currency).toBe(0);
    expect(getState().foo).toBeUndefined();
    expect(spy).toHaveBeenCalledOnce();
    const [newState, prevState] = spy.mock.calls[0];
    expect(newState.currency).toBe(0);
    expect(prevState.currency).toBe(500);
    unsub();
  });

  test('reset keeps subscribers attached', () => {
    const spy = vi.fn();
    const unsub = subscribe(spy);
    reset();
    expect(spy).toHaveBeenCalledOnce();
    setState({ currency: 1 });
    expect(spy).toHaveBeenCalledTimes(2);
    unsub();
  });

  test('array identities are fresh after reset', () => {
    const before = getState();
    const towersBefore = before.towers;
    towersBefore.push('x');
    reset();
    expect(getState().towers).toEqual([]);
    expect(getState().towers).not.toBe(towersBefore);
  });
});
