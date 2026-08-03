/**
 * SLO (Service Level Objective) sampling — per-5-minute request buckets
 * recorded from the API middleware wrapper (`withRateLimit`).
 *
 * In-memory and bounded: only the last 24h of buckets are kept, and each
 * bucket stores at most MAX_SAMPLES latency samples (percentiles beyond
 * that are approximate — fine for operational signals).
 *
 * Note: recording happens on the Node side (withRateLimit), NOT in the
 * Edge middleware — the edge runtime has its own memory space, so an
 * in-memory registry there would be invisible to the Ops dashboard.
 * Page rendering is covered by the prisma:query histograms and the edge
 * Cache-Control policy instead.
 */

const BUCKET_MS = 5 * 60 * 1000;
const MAX_BUCKETS = 288; // 24h / 5min
const MAX_SAMPLES = 500;

interface BucketData {
  group: string;
  bucketStart: number;
  requests: number;
  errors: number;
  latencySamples: number[];
}

const buckets = new Map<string, BucketData>(); // key: `${group}:${bucketStart}`

/** Align an epoch-ms timestamp to its 5-minute bucket start. */
export function bucketStartOf(now = Date.now()): number {
  return Math.floor(now / BUCKET_MS) * BUCKET_MS;
}

/** Coarse SLO group for a request pathname (e.g. `/api/auth/login` → `auth`). */
export function sloGroupOf(pathname: string): string {
  const m = pathname.match(/^\/api\/([^/]+)/);
  if (m) return m[1]!;
  if (pathname.startsWith("/dashboard")) return "dashboard";
  return "public";
}

/**
 * Record one request into its 5-minute bucket.
 *
 * @param ok         false marks a failed request (5xx) — drives error rate.
 * @param latencyMs  optional response latency in ms (percentiles from samples).
 * @param now        test seam — defaults to the current time.
 */
export function recordSloRequest(
  group: string,
  ok: boolean,
  latencyMs?: number,
  now = Date.now(),
): void {
  const start = bucketStartOf(now);
  const key = `${group}:${start}`;
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { group, bucketStart: start, requests: 0, errors: 0, latencySamples: [] };
    buckets.set(key, bucket);
    pruneBuckets();
  }
  bucket.requests += 1;
  if (!ok) bucket.errors += 1;
  if (latencyMs !== undefined && latencyMs >= 0 && bucket.latencySamples.length < MAX_SAMPLES) {
    bucket.latencySamples.push(latencyMs);
  }
}

function pruneBuckets(): void {
  const oldest = bucketStartOf() - (MAX_BUCKETS - 1) * BUCKET_MS;
  for (const [key, b] of buckets) {
    if (b.bucketStart < oldest) buckets.delete(key);
  }
}

export interface SloGroupStats {
  requests: number;
  errors: number;
  /** Error rate in percent (0–100), null when there were no requests. */
  errorRate: number | null;
  avgLatencyMs: number | null;
  p95LatencyMs: number | null;
}

export interface SloBucketReport {
  bucketStart: number;
  perGroup: Record<string, SloGroupStats>;
}

/** Bucketed SLO data for the last `hours` (default 24), oldest first. */
export function sloReport(hours = 24): SloBucketReport[] {
  const since = Date.now() - hours * 3_600_000;
  const byStart = new Map<number, SloBucketReport>();
  for (const bucket of buckets.values()) {
    if (bucket.bucketStart < since) continue;
    let report = byStart.get(bucket.bucketStart);
    if (!report) {
      report = { bucketStart: bucket.bucketStart, perGroup: {} };
      byStart.set(bucket.bucketStart, report);
    }
    const sorted = [...bucket.latencySamples].sort((a, b) => a - b);
    const avg =
      bucket.latencySamples.length > 0
        ? bucket.latencySamples.reduce((a, c) => a + c, 0) / bucket.latencySamples.length
        : null;
    const p95 =
      sorted.length > 0
        ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? null
        : null;
    report.perGroup[bucket.group] = {
      requests: bucket.requests,
      errors: bucket.errors,
      errorRate: bucket.requests > 0 ? (bucket.errors / bucket.requests) * 100 : null,
      avgLatencyMs: avg,
      p95LatencyMs: p95,
    };
  }
  return [...byStart.values()].sort((a, b) => a.bucketStart - b.bucketStart);
}

/** Full reset — tests. */
export function resetSlo(): void {
  buckets.clear();
}
