/**
 * Live verification drill for Redis-backed rate limiting — proves the two
 * production guarantees the Large checklist (گام ۲) depends on:
 *
 *   1. SHARED across instances — two separate Node processes (simulating
 *      two app instances) hitting the same Redis must see ONE window
 *      counter: process A consumes max, process B's next request is
 *      blocked. A separate process has its own memory, so shared state can
 *      only come from Redis — that is the multi-instance proof.
 *   2. FALLBACK when Redis is unavailable — with REDIS_URL stripped, the
 *      limiter must fall back to the in-memory store and still enforce
 *      max (and never touch Redis).
 *
 * Also checks the health contract: getRedisClient().ping() works.
 *
 * NOTE on burst: the drill deliberately uses burst: 0 — the two-process
 * proof targets the WINDOW counter (the burst sub-window is already
 * covered by the 6 burst unit tests in rate-limit.test.ts).
 *
 * Usage:
 *   npm run verify:redis            → shared mode, then fallback mode
 *   npx tsx scripts/verify-redis.ts shared | fallback
 *
 * Prerequisite: a reachable Redis at REDIS_URL (or the shared-mode checks
 * fail loudly). Exit code 1 on any failed check (CI-friendly).
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/** Minimal .env loader — dev convenience; exported vars always win. */
function loadDotEnv(): void {
  try {
    if (!existsSync(".env")) return;
    const content = readFileSync(".env", "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]!]) {
        process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // best-effort
  }
}

loadDotEnv();

const mode = process.argv[2] ?? "shared";
let failures = 0;

function check(label: string, ok: boolean): void {
  console.log(` ${ok ? "✅" : "❌"} ${label}`);
  if (!ok) failures++;
}

/** Run the child helper in a SEPARATE process; returns its exit code. */
function runChild(childMode: string, env: Record<string, string | undefined>): number {
  const res = spawnSync(
    process.execPath,
    ["--import", "tsx", resolve("scripts/redis-drill-child.ts"), childMode],
    { env: { ...process.env, ...env }, encoding: "utf8", timeout: 60_000 },
  );
  if (res.stdout) console.log(res.stdout.trim());
  if (res.stderr) console.error(res.stderr.trim());
  return res.status ?? 1;
}

async function verifyShared(): Promise<void> {
  console.log("🔴 verify-redis — mode: shared (two-process proof)\n");

  // Unique identifier so repeated runs never collide with a live counter.
  const id = `drill:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  // 0. Health contract: client ping works against the configured Redis.
  const { getRedisClient } = await import("@/lib/redis-client");
  const client = await getRedisClient();
  check("REDIS_URL configured and client resolves", client !== null);
  if (!client) {
    console.error("\n⛔ Redis unreachable — set REDIS_URL and start Redis, then re-run.");
    process.exit(1);
  }
  try {
    const pong = await client.ping();
    check(`Redis ping → ${pong}`, pong === "PONG");
  } catch (err) {
    check("Redis ping", false);
    console.error("ping error:", err);
  }

  // 1. Process A consumes max (3) — all allowed.
  const consumeExit = runChild("consume", { REDIS_DRILL_ID: id });
  check("instance A: 3 requests within max are allowed", consumeExit === 0);

  // 2. Process B (fresh process, fresh memory) checks the SAME identifier —
  //    must be blocked because the counter lives in Redis, not in A's heap.
  const blockedExit = runChild("blocked", { REDIS_DRILL_ID: id });
  check("instance B: next request is blocked (state shared via Redis)", blockedExit === 0);

  // 3. reset() must clear the shared state so B is allowed again.
  const { createRedisRateLimiter } = await import("@/lib/rate-limit-redis");
  const limiter = createRedisRateLimiter({ windowMs: 300_000, max: 3, burst: 0, burstWindowMs: 5_000 });
  await limiter.reset(id);
  const afterReset = await limiter.check(id);
  check("reset() clears shared counter (next check allowed)", afterReset.success === true);

  await limiter.shutdown();
  console.log(failures === 0 ? "\n🎉 All shared-mode checks passed." : `\n❌ ${failures} check(s) failed.`);
}

async function verifyFallback(): Promise<void> {
  console.log("🔴 verify-redis — mode: fallback (no Redis)\n");
  failures = 0;

  // Strip REDIS_URL so the child imports env.ts without it → in-memory path.
  const childEnv: Record<string, string | undefined> = { REDIS_URL: undefined };
  const exitCode = runChild("fallback", childEnv);
  check("in-memory fallback enforces max without touching Redis", exitCode === 0);
  console.log(failures === 0 ? "\n🎉 All fallback-mode checks passed." : `\n❌ ${failures} check(s) failed.`);
}

async function main(): Promise<void> {
  if (mode === "shared") {
    await verifyShared();
  } else if (mode === "fallback") {
    await verifyFallback();
  } else {
    console.error(`Unknown mode: ${mode} (expected "shared" | "fallback")`);
    process.exit(1);
  }
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("verify-redis crashed:", err);
  process.exit(1);
});
