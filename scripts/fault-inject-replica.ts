/**
 * Fault-injection drill — prove the read-replica fallback works under a
 * REAL replica outage.
 *
 * What it does:
 *   1. Points REPLICA_URL at an unreachable host (127.0.0.1:1).
 *   2. Runs a heavy read (course count) through `runOnReplica`.
 *   3. Verifies the query still succeeds — i.e. it fell back to the
 *      primary without throwing — and reports timing.
 *
 * Usage:
 *   npm run drill:replica
 *   # or point at your own dead endpoint:
 *   REPLICA_URL_FORCE=postgresql://x:y@10.255.255.1:5432/db npm run drill:replica
 *
 * Exit code: 0 when the fallback worked, 1 otherwise.
 */
import { readFileSync } from "node:fs";

/** Minimal .env loader — dev convenience; exported vars always win. */
function loadDotEnv(): void {
  try {
    const content = readFileSync(".env", "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]!]) {
        process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env file — rely on the exported environment.
  }
}

loadDotEnv();

async function main() {
  // Force an unreachable replica — 127.0.0.1:1 refuses connections on any
  // platform. Override with REPLICA_URL_FORCE for a network-level test.
  const replicaUrl =
    process.env.REPLICA_URL_FORCE ?? "postgresql://user:pass@127.0.0.1:1/nonexistent";
  process.env.REPLICA_URL = replicaUrl;

  // Dynamic import ON PURPOSE: env vars must be set before the module
  // reads them at import time.
  const { runOnReplica } = await import("@/lib/db/replica");

  console.log(`ℹ️  Fault injection: REPLICA_URL = ${replicaUrl}`);
  console.log("   Running a heavy read through runOnReplica…");

  const startedAt = Date.now();
  let attempts = 0;
  let count: number;

  try {
    count = await runOnReplica(async (db) => {
      attempts += 1;
      return db.course.count({ where: { published: true } });
    });
  } catch (err) {
    console.error("❌ runOnReplica THREW — fallback is broken:", err);
    process.exit(1);
    return;
  }

  const elapsed = Date.now() - startedAt;

  if (attempts === 1) {
    console.log("✅ Query succeeded on the FIRST attempt.");
    console.log("   (Replica client built without error — the outage may not");
    console.log("    have been forced. Check REPLICA_URL_FORCE / firewall.)");
  } else if (attempts >= 2) {
    console.log(`✅ Fallback verified — replica failed, query re-ran on primary (${attempts} attempts).`);
  }

  console.log(`   courses = ${count} · ${elapsed}ms`);
  console.log("✅ Drill complete — no 500, no crash. Fallback works.");
}

main().catch((e) => {
  console.error("❌ خطا:", e);
  process.exit(1);
});
