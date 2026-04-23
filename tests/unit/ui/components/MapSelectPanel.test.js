import { describe, expect, it } from 'vitest';
import { mapSelectPanel } from '../../../../src/ui/components/MapSelectPanel.js';

describe('mapSelectPanel', () => {
  it('with empty personalBests shows select-map button for map1 and "No runs yet"', () => {
    const out = mapSelectPanel({ personalBests: {} });
    expect(out).toContain('data-action="select-map"');
    expect(out).toContain('data-map-id="map1"');
    expect(out).toContain('No runs yet');
  });

  it('with a personal best shows wave and score', () => {
    const out = mapSelectPanel({
      personalBests: { map1: [{ waveReached: 15, score: 1234, seed: 42 }] },
    });
    expect(out).toContain('Wave 15');
    expect(out).toContain('1234');
  });

  it('contains exactly 4 disabled buttons for locked maps', () => {
    const out = mapSelectPanel({ personalBests: {} });
    const matches = out.match(/<button[^>]*disabled/g);
    expect(matches).not.toBeNull();
    expect(matches.length).toBe(4);
  });

  it('contains a back button with data-action="back"', () => {
    const out = mapSelectPanel({ personalBests: {} });
    expect(out).toContain('data-action="back"');
  });

  it('HTML-escapes dangerous values in score', () => {
    const out = mapSelectPanel({
      personalBests: { map1: [{ waveReached: 1, score: '<script>', seed: 0 }] },
    });
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
  });
});
