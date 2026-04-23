export function createSeededRng(seed) {
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function intInRange(gen, min, max) {
  return Math.floor(gen() * (max - min + 1)) + min;
}

export function floatInRange(gen, min, max) {
  return min + gen() * (max - min);
}

export function pickWeighted(gen, entries) {
  let total = 0;
  for (const e of entries) total += e.weight;
  let r = gen() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r < 0) return e.item;
  }
  return entries[entries.length - 1].item;
}

export function shuffle(gen, arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = intInRange(gen, 0, i);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}
