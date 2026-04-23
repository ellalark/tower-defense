import { html } from '../render.js';

export function mainMenuPanel() {
  return html`
    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:auto;">
      <div style="display:flex;flex-direction:column;gap:16px;align-items:center;">
        <h1 style="color:#e0f0ff;font-family:sans-serif;font-size:48px;margin:0 0 32px;">Tower Defense</h1>
        <button data-action="play" style="width:200px;padding:14px 0;font-size:20px;cursor:pointer;background:#1a7a3a;color:#fff;border:none;border-radius:6px;">Play</button>
        <button data-action="settings" style="width:200px;padding:14px 0;font-size:20px;cursor:pointer;background:#2a4a7a;color:#fff;border:none;border-radius:6px;">Settings</button>
        <button data-action="quit" style="width:200px;padding:14px 0;font-size:20px;cursor:pointer;background:#5a2a2a;color:#fff;border:none;border-radius:6px;">Quit</button>
      </div>
    </div>
  `;
}
