import { describe, expect, test, vi } from 'vitest';
import { createEventBus } from '../../../src/state/events.js';

describe('createEventBus', () => {
  test('subscribe + emit: listener receives payload', () => {
    const bus = createEventBus();
    let received;
    bus.on('tick', (p) => {
      received = p;
    });
    bus.emit('tick', 42);
    expect(received).toBe(42);
  });

  test('multiple listeners fire in subscription order', () => {
    const bus = createEventBus();
    const order = [];
    bus.on('e', () => order.push(1));
    bus.on('e', () => order.push(2));
    bus.on('e', () => order.push(3));
    bus.emit('e', null);
    expect(order).toEqual([1, 2, 3]);
  });

  test('off(name, fn) unsubscribes listener', () => {
    const bus = createEventBus();
    let count = 0;
    const fn = () => {
      count++;
    };
    bus.on('x', fn);
    bus.emit('x', null);
    bus.off('x', fn);
    bus.emit('x', null);
    expect(count).toBe(1);
  });

  test('unsubscribe function returned by on works', () => {
    const bus = createEventBus();
    let count = 0;
    const unsub = bus.on('x', () => {
      count++;
    });
    bus.emit('x', null);
    unsub();
    bus.emit('x', null);
    expect(count).toBe(1);
  });

  test('unsubscribe is idempotent', () => {
    const bus = createEventBus();
    let count = 0;
    const unsub = bus.on('x', () => {
      count++;
    });
    unsub();
    unsub();
    bus.emit('x', null);
    expect(count).toBe(0);
  });

  test('off with unknown name/fn is a no-op', () => {
    const bus = createEventBus();
    expect(() => bus.off('nope', () => {})).not.toThrow();
    bus.on('y', () => {});
    expect(() => bus.off('y', () => {})).not.toThrow();
  });

  test('throwing listener logs error and siblings still fire', () => {
    const bus = createEventBus();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const results = [];
    bus.on('e', () => {
      throw new Error('boom');
    });
    bus.on('e', () => results.push('ok'));
    bus.emit('e', null);
    expect(results).toEqual(['ok']);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  test('duplicate registration fires twice; one off removes one', () => {
    const bus = createEventBus();
    let count = 0;
    const fn = () => {
      count++;
    };
    bus.on('e', fn);
    bus.on('e', fn);
    bus.emit('e', null);
    expect(count).toBe(2);
    bus.off('e', fn);
    bus.emit('e', null);
    expect(count).toBe(3);
  });

  test('separate buses are independent', () => {
    const a = createEventBus();
    const b = createEventBus();
    let heard = false;
    a.on('ev', () => {
      heard = true;
    });
    b.emit('ev', null);
    expect(heard).toBe(false);
  });

  test('payload is passed through as-is (object identity)', () => {
    const bus = createEventBus();
    const obj = { x: 1 };
    let got;
    bus.on('e', (p) => {
      got = p;
    });
    bus.emit('e', obj);
    expect(got).toBe(obj);
  });

  test('mid-emit add does not fire this round but fires on next emit', () => {
    const bus = createEventBus();
    const fired = [];

    const lateListener = () => fired.push('late');

    bus.on('e', () => {
      fired.push('a');
      bus.on('e', lateListener);
    });

    bus.emit('e', null);
    expect(fired).toEqual(['a']);

    fired.length = 0;
    bus.emit('e', null);
    expect(fired).toContain('late');
  });

  test('mid-emit remove still fires this round (snapshot semantics)', () => {
    const bus = createEventBus();
    const fired = [];

    const bUnsub = bus.on('e', () => fired.push('b'));

    bus.on('e', () => {
      fired.push('a');
      bUnsub();
    });

    bus.on('e', () => fired.push('c'));

    bus.emit('e', null);
    expect(fired).toEqual(['b', 'a', 'c']);

    fired.length = 0;
    bus.emit('e', null);
    expect(fired).toEqual(['a', 'c']);
  });
});
