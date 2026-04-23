import { describe, expect, it } from 'vitest';
import { createWaveRunner } from '../../../src/systems/waveRunner.js';
import { createSeededRng } from '../../../src/rng/seeded.js';
import { generate } from '../../../src/systems/waveSpawner.js';

function makeBus() {
  const events = [];
  return {
    bus: { emit(name, payload) { events.push({ name, payload }); } },
    events,
  };
}

function makeWave(entries, waveNumber = 1, isBoss = false, isFinal = false) {
  return { entries, meta: { waveNumber, isBoss, isFinal } };
}

function constantSource(wave) {
  return () => wave;
}

describe('waveRunner — single-entry wave timing', () => {
  it('count=3, delay=0, spacing=10 spawns at ticks 0, 10, 20', () => {
    const { bus, events } = makeBus();
    const wave = makeWave([{ enemyId: 'grunt', count: 3, spacingTicks: 10, delayTicks: 0 }]);
    const runner = createWaveRunner({ bus, waveSource: constantSource(wave) });

    for (let i = 0; i < 21; i++) runner.tick();

    const spawns = events.filter(e => e.name === 'enemy:spawn');
    expect(spawns).toHaveLength(3);
    expect(spawns[0].payload.enemyId).toBe('grunt');
  });

  it('spawns happen exactly at the expected in-wave ticks', () => {
    const { bus, events } = makeBus();
    const wave = makeWave([{ enemyId: 'grunt', count: 3, spacingTicks: 10, delayTicks: 0 }]);
    const runner = createWaveRunner({ bus, waveSource: constantSource(wave) });

    const spawnAtTick = [];
    for (let i = 0; i < 21; i++) {
      const before = events.length;
      runner.tick();
      if (events.length > before) spawnAtTick.push(i);
    }

    expect(spawnAtTick).toEqual([0, 10, 20]);
  });
});

describe('waveRunner — hpMul/dmgMul propagation', () => {
  it('propagates hpMul and dmgMul from entry', () => {
    const { bus, events } = makeBus();
    const wave = makeWave([{ enemyId: 'grunt', count: 1, spacingTicks: 0, delayTicks: 0, hpMul: 1.5, dmgMul: 2.0 }]);
    const runner = createWaveRunner({ bus, waveSource: constantSource(wave) });
    runner.tick();
    expect(events[0].payload.hpMul).toBe(1.5);
    expect(events[0].payload.dmgMul).toBe(2.0);
  });
});

describe('waveRunner — default multipliers', () => {
  it('defaults hpMul and dmgMul to 1 when absent', () => {
    const { bus, events } = makeBus();
    const wave = makeWave([{ enemyId: 'grunt', count: 1, spacingTicks: 0, delayTicks: 0 }]);
    const runner = createWaveRunner({ bus, waveSource: constantSource(wave) });
    runner.tick();
    expect(events[0].payload.hpMul).toBe(1);
    expect(events[0].payload.dmgMul).toBe(1);
  });
});

describe('waveRunner — delay + spacing', () => {
  it('delay=5, spacing=3, count=2 → spawns at ticks 5 and 8, none before', () => {
    const { bus, events } = makeBus();
    const wave = makeWave([{ enemyId: 'fast', count: 2, spacingTicks: 3, delayTicks: 5 }]);
    const runner = createWaveRunner({ bus, waveSource: constantSource(wave) });

    const spawnAtTick = [];
    for (let i = 0; i < 9; i++) {
      const before = events.length;
      runner.tick();
      if (events.length > before) spawnAtTick.push(i);
    }

    expect(spawnAtTick).toEqual([5, 8]);
  });
});

describe('waveRunner — zero spacing', () => {
  it('spacing=0, count=1, delay=0 → one spawn at tick 0', () => {
    const { bus, events } = makeBus();
    const wave = makeWave([{ enemyId: 'boss', count: 1, spacingTicks: 0, delayTicks: 0 }]);
    const runner = createWaveRunner({ bus, waveSource: constantSource(wave) });
    runner.tick();
    expect(events).toHaveLength(1);
    expect(events[0].payload.enemyId).toBe('boss');
  });

  it('spacing=0, count=3, delay=2 → all 3 spawn at tick 2', () => {
    const { bus, events } = makeBus();
    const wave = makeWave([{ enemyId: 'grunt', count: 3, spacingTicks: 0, delayTicks: 2 }]);
    const runner = createWaveRunner({ bus, waveSource: constantSource(wave) });

    runner.tick(); // tick 0
    expect(events).toHaveLength(0);
    runner.tick(); // tick 1
    expect(events).toHaveLength(0);
    runner.tick(); // tick 2
    expect(events).toHaveLength(3);
  });
});

describe('waveRunner — multi-entry within-tick ordering', () => {
  it('two entries scheduled at same tick emit in array order', () => {
    const { bus, events } = makeBus();
    const wave = makeWave([
      { enemyId: 'grunt', count: 1, spacingTicks: 0, delayTicks: 0 },
      { enemyId: 'fast', count: 1, spacingTicks: 0, delayTicks: 0 },
    ]);
    const runner = createWaveRunner({ bus, waveSource: constantSource(wave) });
    runner.tick();
    expect(events[0].payload.enemyId).toBe('grunt');
    expect(events[1].payload.enemyId).toBe('fast');
  });
});

describe('waveRunner — wave advance with no idle gap', () => {
  it('wave 2 starts on the external tick immediately after wave 1 finishes', () => {
    const { bus, events } = makeBus();
    let callCount = 0;
    const waveSource = (waveNumber) => {
      callCount++;
      if (waveNumber === 1) return makeWave([{ enemyId: 'grunt', count: 2, spacingTicks: 5, delayTicks: 0 }], 1);
      return makeWave([{ enemyId: 'fast', count: 1, spacingTicks: 0, delayTicks: 0 }], 2);
    };
    const runner = createWaveRunner({ bus, waveSource });

    const spawnAtExternalTick = [];
    for (let i = 0; i < 10; i++) {
      const before = events.length;
      runner.tick();
      for (let j = before; j < events.length; j++) {
        spawnAtExternalTick.push({ externalTick: i, waveNumber: events[j].payload.waveNumber });
      }
    }

    const wave1Spawns = spawnAtExternalTick.filter(s => s.waveNumber === 1);
    const wave2Spawns = spawnAtExternalTick.filter(s => s.waveNumber === 2);

    expect(wave1Spawns).toHaveLength(2);
    expect(wave1Spawns[0].externalTick).toBe(0);
    expect(wave1Spawns[1].externalTick).toBe(5);

    expect(wave2Spawns).toHaveLength(1);
    expect(wave2Spawns[0].externalTick).toBe(6);
  });
});

describe('waveRunner — scripted + procedural mix', () => {
  it('wave 1 scripted then wave 2 procedural, waveNumbers correct', () => {
    const { bus, events } = makeBus();
    const scripted = makeWave([{ enemyId: 'grunt', count: 2, spacingTicks: 5, delayTicks: 0 }], 1);
    const rng = createSeededRng(42);
    const procedural = generate(2, 1, rng);

    const waveSource = (waveNumber) => {
      if (waveNumber === 1) return scripted;
      return procedural;
    };

    const runner = createWaveRunner({ bus, waveSource });

    const totalTicks = 300;
    for (let i = 0; i < totalTicks; i++) runner.tick();

    const wave1Events = events.filter(e => e.name === 'enemy:spawn' && e.payload.waveNumber === 1);
    const wave2Events = events.filter(e => e.name === 'enemy:spawn' && e.payload.waveNumber === 2);

    expect(wave1Events).toHaveLength(2);

    const wave2TotalCount = procedural.entries.reduce((sum, e) => sum + e.count, 0);
    expect(wave2Events).toHaveLength(wave2TotalCount);

    const allSpawns = events.filter(e => e.name === 'enemy:spawn');
    const firstWave2Idx = allSpawns.findIndex(e => e.payload.waveNumber === 2);
    expect(allSpawns.slice(0, firstWave2Idx).every(e => e.payload.waveNumber === 1)).toBe(true);
  });
});

describe('waveRunner — boss meta propagation', () => {
  it('isBoss and isFinal from wave meta appear in spawn payload', () => {
    const { bus, events } = makeBus();
    const wave = {
      entries: [{ enemyId: 'boss', count: 1, spacingTicks: 0, delayTicks: 0 }],
      meta: { waveNumber: 30, isBoss: true, isFinal: true },
    };
    const runner = createWaveRunner({ bus, waveSource: () => wave });
    runner.tick();
    expect(events[0].payload.isBoss).toBe(true);
    expect(events[0].payload.isFinal).toBe(true);
  });
});

describe('waveRunner — reset()', () => {
  it('after reset, getState returns initial state and next tick re-pulls wave 1', () => {
    const { bus } = makeBus();
    const calls = [];
    const waveSource = (waveNumber) => {
      calls.push(waveNumber);
      return makeWave([{ enemyId: 'grunt', count: 1, spacingTicks: 0, delayTicks: 0 }], waveNumber);
    };
    const runner = createWaveRunner({ bus, waveSource });

    runner.tick();
    runner.tick();
    runner.reset();

    expect(runner.getState()).toEqual({ waveNumber: 1, tickInWave: 0 });

    const callsBefore = calls.length;
    runner.tick();
    expect(calls[callsBefore]).toBe(1);
  });
});

describe('waveRunner — startWave option', () => {
  it('startWave:10 causes first tick to pull wave 10', () => {
    const { bus, events } = makeBus();
    const calls = [];
    const waveSource = (waveNumber) => {
      calls.push(waveNumber);
      return makeWave([{ enemyId: 'grunt', count: 1, spacingTicks: 0, delayTicks: 0 }], waveNumber);
    };
    const runner = createWaveRunner({ bus, waveSource, startWave: 10 });
    runner.tick();
    expect(calls[0]).toBe(10);
    expect(events[0].payload.waveNumber).toBe(10);
  });
});

describe('waveRunner — waveSource called once per wave', () => {
  it('waveSource is called exactly once per wave number, not every tick', () => {
    const { bus } = makeBus();
    const calls = [];
    const waveSource = (waveNumber) => {
      calls.push(waveNumber);
      return makeWave([{ enemyId: 'grunt', count: 1, spacingTicks: 0, delayTicks: 5 }], waveNumber);
    };
    const runner = createWaveRunner({ bus, waveSource });

    for (let i = 0; i < 30; i++) runner.tick();

    const wave1Calls = calls.filter(w => w === 1).length;
    const wave2Calls = calls.filter(w => w === 2).length;
    expect(wave1Calls).toBe(1);
    expect(wave2Calls).toBe(1);
  });
});
