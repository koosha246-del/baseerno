/**
 * Child process helper for scripts/verify-redis.ts — ONE small script run
 * as a separate Node process so the drill can simulate two independent
 * app instances sharing the same Redis backend.
 *
 * Run via `node --import tsx scripts/redis-drill-child.ts <mode>` with env:
 *   REDIS_DRILL_ID  — unique identifier for this drill run
 *
 * Modes:
 *   consume   → check `max` requests on the identifier; all must succeed.
 *               Exit 0.
 *   blocked   → check the SAME identifier again; the next request must be
 *               blocked (success: false). Exit 0 when blocked, 1 when not.
 *   fallback  → REDIS_URL is stripped in the parent's env; getRedisClient()
 *               must return null (in-memory fallback) and the limiter must
 *               still enforce `max` within this process. Exit 0.
 *
 * A separate process has its own memory, so "shared" state can only come
 * from Redis — that is exactly what makes this a multi-instance proof.
 *
 * NOTE on burst: the drill uses burst: 0 on purpose. The two-process proof
 * targets the WINDOW counter; the burst sub-window is already covered by
 * the 6 burst unit tests (rate-limit.test.ts), and sequential requests
 * would otherwise trip the burst cap and pollute the window proof.
 */

const mode = process.argv[2];

async function main(): Promise<void> {
  const { createRedisRateLimiter } = await import("@/lib/rate-limit-redis");
  const { getRedisClient } = await import("@/lib/redis-client");

  const id = process.env.REDIS_DRILL_ID ?? "drill-default";
  const limiter = createRedisRateLimiter({
    windowMs: 300_000,
    max: 3,
    burst: 0,
    burstWindowMs: 5_000,
  });

  if (mode === "consume") {
    const results: boolean[] = [];
    for (let i = 0; i < 3; i++) {
      results.push((await limiter.check(id)).success);
    }
    const allAllowed = results.every(Boolean);
    console.log(`[child:consume] ${results.length} requests → all allowed: ${allAllowed}`);
    process.exit(allAllowed ? 0 : 1);
  }

  if (mode === "blocked") {
    const r = await limiter.check(id);
    const extra = r.success ? "" : ` retryAfter=${r.retryAfter}`;
    console.log(`[child:blocked] success=${r.success}${extra}`);
    process.exit(r.success ? 1 : 0);
  }

  if (mode === "fallback") {
    const client = await getRedisClient();
    const noClient = client === null;
    const results: boolean[] = [];
    for (let i = 0; i < 3; i++) {
      results.push((await limiter.check(`${id}:fb`)).success);
    }
    const blocked4th = !(await limiter.check(`${id}:fb`)).success;
    console.log(
      `[child:fallback] client=${client === null ? "null" : "PRESENT"} all3=${results.every(Boolean)} blocked4th=${blocked4th}`,
    );
    process.exit(noClient && results.every(Boolean) && blocked4th ? 0 : 1);
  }

  console.error(`[child] unknown mode: ${mode}`);
  process.exit(2);
}

main().catch((err) => {
  console.error("[child] crashed:", err);
  process.exit(1);
});
