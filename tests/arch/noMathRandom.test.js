import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const SRC_ROOT = fileURLToPath(new URL('../../src', import.meta.url));
const ALLOWED = `${sep}rng${sep}`;
const MATH_RANDOM_RE = /\bMath\.random\s*\(/;

function collectJsFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      out.push(...collectJsFiles(path));
    } else if (name.endsWith('.js')) {
      out.push(path);
    }
  }
  return out;
}

describe('arch: Math.random is confined to src/rng/', () => {
  test('no Math.random() calls outside src/rng/', () => {
    const files = collectJsFiles(SRC_ROOT).filter((p) => !p.includes(ALLOWED));
    const violations = files.filter((f) => MATH_RANDOM_RE.test(readFileSync(f, 'utf8')));
    expect(violations).toEqual([]);
  });

  test('scanner detects Math.random when present (self-check)', () => {
    expect(MATH_RANDOM_RE.test('const x = Math.random();')).toBe(true);
    expect(MATH_RANDOM_RE.test('const x = Math.floor(0);')).toBe(false);
  });
});
