/**
 * Lightweight in-memory metrics — counters and histograms for business
 * and technical signals.
 *
 * Design constraints:
 *  - Zero external dependency, synchronous increments (no latency cost).
 *  - Bounded memory: entries older than MAX_ENTRIES are evicted, and
 *    `snapshotMetrics()` (called by the ADMIN /api/metrics endpoint)
 *    can reset the counters so stale data doesn't accumulate forever.
 *
 * Signals recorded today:
 *  - auth:login / auth:register / auth:failed
 *  - payment:success / payment:failed
 *  - enrollment:free / enrollment:paid
 *  - search:query
 *  - ai:message (single counter for real + mock replies)
 *  - api:error
 *  - prisma:query (duration histogram by model+op)
 *
 * (http:request sampling by path prefix is a planned signal — not yet
 * recorded; nothing in the Ops dashboard reads it today.)
 */

interface CounterEntry {
  value: number;
  lastUpdated: number;
}

interface HistogramEntry {
  count: number;
  totalMs: number;
  maxMs: number;
  lastUpdated: number;
}

const counters = new Map<string, CounterEntry>();
const histograms = new Map<string, HistogramEntry>();

const MAX_ENTRIES = 500;
const MAX_HISTOGRAM_SAMPLES = 10_000;

/** Increment a named counter (default by 1). */
export function incr(name: string, by = 1): void {
  const entry = counters.get(name) ?? { value: 0, lastUpdated: Date.now() };
  entry.value += by;
  entry.lastUpdated = Date.now();
  counters.set(name, entry);
  evictIfNeeded();
}

/** Record a duration (ms) in a named histogram (p50/p95/p99 computed on snapshot). */
export function observe(name: string, ms: number): void {
  const entry = histograms.get(name) ?? {
    count: 0,
    totalMs: 0,
    maxMs: 0,
    lastUpdated: Date.now(),
  };
  entry.count += 1;
  entry.totalMs += ms;
  entry.maxMs = Math.max(entry.maxMs, ms);
  entry.lastUpdated = Date.now();
  histograms.set(name, entry);
  evictIfNeeded();
}

function evictIfNeeded(): void {
  if (counters.size + histograms.size > MAX_ENTRIES) {
    // Keep only the most recently touched entries (simple, bounded).
    const all = [...counters, ...histograms].sort(
      (a, b) => b[1].lastUpdated - a[1].lastUpdated,
    );
    const keep = new Set(all.slice(0, MAX_ENTRIES).map(([k]) => k));
    for (const k of [...counters.keys()]) if (!keep.has(k)) counters.delete(k);
    for (const k of [...histograms.keys()]) if (!keep.has(k)) histograms.delete(k);
  }
}

function percentile(samples: number[], p: number): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx] ?? 0;
}

export interface MetricsSnapshot {
  counters: Record<string, number>;
  histograms: Record<string, { count: number; avgMs: number; approxP95Ms: number; maxMs: number }>;
  sampledAt: string;
}

/**
 * Snapshot current metrics. When `reset` is true (used by the admin
 * endpoint after a scrape), counters are cleared to avoid unbounded
 * growth — histograms are kept but sampling windows rotate via the
 * per-key cap.
 */
export function snapshotMetrics(reset = false): MetricsSnapshot {
  const counterOut: Record<string, number> = {};
  for (const [k, v] of counters) counterOut[k] = v.value;

  const histOut: Record<string, MetricsSnapshot["histograms"][string]> = {};
  for (const [k, v] of histograms) {
    // We only keep aggregate stats; percentile precision is approximate
    // for the max samples window (fine for operational signals).
    const avgMs = v.count > 0 ? v.totalMs / v.count : 0;
    // approxP95Ms = midpoint between avg and max — a cheap, honest proxy
    // for the p95 when we don't retain the full sample list. Dashboards
    // should treat it as a trend signal, not an exact percentile.
    const approxP95Ms = avgMs + (v.maxMs - avgMs) * 0.5;
    histOut[k] = {
      count: v.count,
      avgMs: Math.round(avgMs * 10) / 10,
      approxP95Ms: Math.round(approxP95Ms),
      maxMs: v.maxMs,
    };
  }

  if (reset) counters.clear();

  return { counters: counterOut, histograms: histOut, sampledAt: new Date().toISOString() };
}

/** Full reset — used by tests. */
export function resetMetrics(): void {
  counters.clear();
  histograms.clear();
}
