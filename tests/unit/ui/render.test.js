// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { html, mount } from '../../../src/ui/render.js';

describe('html tagged template', () => {
  it('returns a string', () => {
    expect(typeof html`<div>hello</div>`).toBe('string');
  });

  it('interpolates values', () => {
    const name = 'world';
    expect(html`<span>${name}</span>`).toBe('<span>world</span>');
  });

  it('escapes < in interpolated values', () => {
    expect(html`<div>${'<script>'}</div>`).toBe('<div>&lt;script&gt;</div>');
  });

  it('escapes > in interpolated values', () => {
    expect(html`<div>${'a>b'}</div>`).toBe('<div>a&gt;b</div>');
  });

  it('escapes " in interpolated values', () => {
    expect(html`<div>${'"quoted"'}</div>`).toBe('<div>&quot;quoted&quot;</div>');
  });

  it('escapes & in interpolated values', () => {
    expect(html`<div>${'a&b'}</div>`).toBe('<div>a&amp;b</div>');
  });

  it('html.raw bypasses escaping', () => {
    const inner = html`<strong>bold</strong>`;
    expect(html`<div>${html.raw(inner)}</div>`).toBe('<div><strong>bold</strong></div>');
  });

  it('composes nested html calls via html.raw', () => {
    const child = html`<em>${'x<y'}</em>`;
    const result = html`<div>${html.raw(child)}</div>`;
    expect(result).toBe('<div><em>x&lt;y</em></div>');
  });

  it('handles multiple interpolations', () => {
    const a = 'A&B';
    const b = '<C>';
    expect(html`${a}+${b}`).toBe('A&amp;B+&lt;C&gt;');
  });

  it('static strings are not escaped', () => {
    expect(html`<div class="foo">bar</div>`).toBe('<div class="foo">bar</div>');
  });
});

describe('mount', () => {
  it('renders component output into root', () => {
    const root = document.createElement('div');
    mount(root, () => html`<p>hello</p>`);
    expect(root.innerHTML).toBe('<p>hello</p>');
  });

  it('accepts a selector string as root', () => {
    const root = document.createElement('div');
    root.id = 'test-mount-root';
    document.body.appendChild(root);
    mount('#test-mount-root', () => html`<span>sel</span>`);
    expect(root.innerHTML).toBe('<span>sel</span>');
    document.body.removeChild(root);
  });

  it('fires delegated click handler on matching element', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const handler = vi.fn();
    mount(root, () => html`<button data-action="go">Go</button>`, {
      on: { 'click [data-action="go"]': handler },
    });
    root.querySelector('button').click();
    expect(handler).toHaveBeenCalledOnce();
    document.body.removeChild(root);
  });

  it('does not fire handler when selector does not match', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const handler = vi.fn();
    mount(root, () => html`<button data-action="other">X</button>`, {
      on: { 'click [data-action="go"]': handler },
    });
    root.querySelector('button').click();
    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(root);
  });

  it('unmount clears innerHTML', () => {
    const root = document.createElement('div');
    const { unmount } = mount(root, () => html`<p>content</p>`);
    unmount();
    expect(root.innerHTML).toBe('');
  });

  it('unmount detaches delegated listeners', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const handler = vi.fn();
    const { unmount } = mount(root, () => html`<button data-action="x">X</button>`, {
      on: { 'click [data-action="x"]': handler },
    });
    unmount();
    root.innerHTML = '<button data-action="x">X</button>';
    root.querySelector('button').click();
    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(root);
  });

  it('rerender updates the DOM', () => {
    const root = document.createElement('div');
    let count = 0;
    const ctrl = mount(root, () => html`<p>${count}</p>`);
    expect(root.innerHTML).toBe('<p>0</p>');
    count = 1;
    ctrl.rerender();
    expect(root.innerHTML).toBe('<p>1</p>');
  });
});
