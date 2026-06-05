/**
 * Tiny deterministic hash + PRNG. Mock KPI values are a pure function of
 * (entityId, kpiId, period) so the whole prototype is stable across reloads
 * and every derived stat (Δ, trend, RAG, leaderboard rank) is reproducible.
 */
export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** stable pseudo-random in [0, 1) from a string key. */
export function rand01(key: string): number {
  return (hash(key) % 100000) / 100000;
}

/** stable noise in [-spread, +spread]. */
export function noise(key: string, spread: number): number {
  return (rand01(key) - 0.5) * 2 * spread;
}
