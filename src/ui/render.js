const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ESCAPE_MAP[c]);

const RAW = Symbol('raw');
const raw = (s) => ({ [RAW]: s });

export function html(strings, ...values) {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      const v = values[i];
      result +=
        v !== null && v !== undefined && typeof v === 'object' && RAW in v ? v[RAW] : escapeHtml(v);
    }
  }
  return result;
}

html.raw = raw;

export function mount(root, render, opts = {}) {
  const el = typeof root === 'string' ? document.querySelector(root) : root;
  const listeners = [];

  const draw = () => {
    el.innerHTML = render();
  };

  draw();

  if (opts.on) {
    for (const key of Object.keys(opts.on)) {
      const spaceIdx = key.indexOf(' ');
      const eventType = key.slice(0, spaceIdx);
      const selector = key.slice(spaceIdx + 1);
      const handler = opts.on[key];
      const listener = (e) => {
        if (e.target.closest(selector)) handler(e);
      };
      el.addEventListener(eventType, listener);
      listeners.push({ eventType, listener });
    }
  }

  const unmount = () => {
    el.innerHTML = '';
    for (const { eventType, listener } of listeners) {
      el.removeEventListener(eventType, listener);
    }
  };

  const rerender = () => draw();

  return { unmount, rerender };
}
