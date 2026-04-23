import { html } from '../render.js';

function pbLine(personalBests) {
  const entry = personalBests?.map1?.[0];
  if (!entry) return html`No runs yet`;
  return html`Best: Wave ${entry.waveReached} — Score ${entry.score}`;
}

export function mapSelectPanel({ personalBests }) {
  return html`
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;pointer-events:auto;background:rgba(0,0,0,0.6);">
      <div style="display:flex;align-items:center;padding:24px 32px;gap:16px;">
        <button data-action="back" style="padding:8px 18px;font-size:16px;cursor:pointer;background:#2a4a7a;color:#fff;border:none;border-radius:6px;">← Back</button>
        <h1 style="flex:1;text-align:center;color:#e0f0ff;font-family:sans-serif;font-size:36px;margin:0;">Select Map</h1>
        <div style="width:90px;"></div>
      </div>
      <div style="display:flex;flex-direction:row;gap:24px;justify-content:center;align-items:flex-start;padding:32px;">
        <button data-action="select-map" data-map-id="map1" style="width:160px;padding:24px 12px;font-size:18px;cursor:pointer;background:#1a7a3a;color:#fff;border:none;border-radius:8px;display:flex;flex-direction:column;gap:8px;align-items:center;">
          <span>Map 1</span>
          <span style="font-size:13px;opacity:0.85;">${html.raw(pbLine(personalBests))}</span>
        </button>
        <button disabled style="width:160px;padding:24px 12px;font-size:18px;cursor:not-allowed;background:#333;color:#888;border:none;border-radius:8px;opacity:0.5;">Map 2 — Locked</button>
        <button disabled style="width:160px;padding:24px 12px;font-size:18px;cursor:not-allowed;background:#333;color:#888;border:none;border-radius:8px;opacity:0.5;">Map 3 — Locked</button>
        <button disabled style="width:160px;padding:24px 12px;font-size:18px;cursor:not-allowed;background:#333;color:#888;border:none;border-radius:8px;opacity:0.5;">Map 4 — Locked</button>
        <button disabled style="width:160px;padding:24px 12px;font-size:18px;cursor:not-allowed;background:#333;color:#888;border:none;border-radius:8px;opacity:0.5;">Map 5 — Locked</button>
      </div>
    </div>
  `;
}
