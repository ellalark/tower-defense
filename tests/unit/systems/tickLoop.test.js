import { describe, expect, it, vi } from 'vitest';
import { TICK_MS } from '../../../src/config/constants.js';
import { createLoop } from '../../../src/systems/tickLoop.js';

describe('createLoop', () => {
  it('advance returns ticks equal to exact multiple of TICK_MS', () => {
    const onTick = vi.fn();
    const loop = createLoop({ onTick });
    const result = loop.advance(TICK_MS * 10, 1);
    expect(onTick).toHaveBeenCalledTimes(10);
    expect(result.ticks).toBe(10);
  });

  it('advance returns correct ticks and alpha for non-multiple delta', () => {
    const onTick = vi.fn();
    const loop = createLoop({ onTick });
    const result = loop.advance(TICK_MS * 3 + TICK_MS / 2, 1);
    expect(result.ticks).toBe(3);
    expect(result.alpha).toBeCloseTo(0.5);
  });

  it('leftover accumulator carries to next advance call', () => {
    const onTick = vi.fn();
    const loop = createLoop({ onTick });
    const first = loop.advance(TICK_MS * 0.6, 1);
    expect(first.ticks).toBe(0);
    const second = loop.advance(TICK_MS * 0.6, 1);
    expect(second.ticks).toBe(1);
  });

  it('speed multiplier scales tick count', () => {
    const loop2 = createLoop({ onTick: vi.fn() });
    const r2 = loop2.advance(TICK_MS, 2);
    expect(r2.ticks).toBe(2);

    const loop3 = createLoop({ onTick: vi.fn() });
    const r3 = loop3.advance(TICK_MS, 3);
    expect(r3.ticks).toBe(3);

    const loop1 = createLoop({ onTick: vi.fn() });
    const r1 = loop1.advance(TICK_MS, 1);
    expect(r1.ticks).toBe(1);
  });

  it('reset zeros accumulator so prior remainder is dropped', () => {
    const onTick = vi.fn();
    const loop = createLoop({ onTick });
    loop.advance(TICK_MS * 0.9, 1);
    loop.reset();
    const result = loop.advance(TICK_MS * 0.5, 1);
    expect(result.ticks).toBe(0);
    expect(result.alpha).toBeCloseTo(0.5);
  });

  it('advance returns an object with integer ticks and alpha in [0, 1)', () => {
    const loop = createLoop({ onTick: vi.fn() });
    const result = loop.advance(TICK_MS * 2.7, 1);
    expect(typeof result.ticks).toBe('number');
    expect(Number.isInteger(result.ticks)).toBe(true);
    expect(typeof result.alpha).toBe('number');
    expect(result.alpha).toBeGreaterThanOrEqual(0);
    expect(result.alpha).toBeLessThan(1);
  });

  it('onTick is called synchronously', () => {
    let count = 0;
    const loop = createLoop({ onTick: () => count++ });
    loop.advance(TICK_MS * 5, 1);
    expect(count).toBe(5);
  });
});
