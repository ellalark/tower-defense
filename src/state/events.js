export function createEventBus() {
  const listeners = new Map();

  function on(name, fn) {
    if (!listeners.has(name)) listeners.set(name, []);
    const list = listeners.get(name);
    const entry = { fn };
    list.push(entry);
    let removed = false;
    return () => {
      if (removed) return;
      removed = true;
      const idx = list.indexOf(entry);
      if (idx !== -1) list.splice(idx, 1);
    };
  }

  function off(name, fn) {
    const list = listeners.get(name);
    if (!list) return;
    const idx = list.findIndex((e) => e.fn === fn);
    if (idx !== -1) list.splice(idx, 1);
  }

  function emit(name, payload) {
    const list = listeners.get(name);
    if (!list) return;
    const snapshot = [...list];
    for (const entry of snapshot) {
      try {
        entry.fn(payload);
      } catch (err) {
        console.error(err);
      }
    }
  }

  return { on, off, emit };
}
