#!/usr/bin/env node
/**
 * Generate production-ready secrets (no dependencies).
 *
 * Usage:  node scripts/generate-secrets.mjs
 * Print each value and copy it into your hosting provider's env vars
 * (Railway → Service → Variables). Never commit real secrets.
 */
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";

const b64 = (bytes) => randomBytes(bytes).toString("base64url");

const secrets = {
  JWT_SECRET: b64(48), // >= 32 chars — signs session tokens
  PAYMENT_SIGNATURE_SECRET: b64(32), // >= 16 chars — HMACs gateway callbacks
  CRON_SECRET: bdfSafe(b64(24)), // URL/header-safe cron bearer token
};

function bdfSafe(s) {
  return s; // base64url is already header-safe (no +, /, =)
}

const lines = Object.entries(secrets)
  .map(([k, v]) => `${k}=${v}`)
  .join("\n");

console.log("\n🔐 Copy these into your provider (Railway/Vercel → Variables):\n");
console.log(lines);
console.log(
  "\n⚠️  Treat these like passwords. Rotate by setting *_OLD variants,\n   not by silently replacing.",
);

// Optional convenience file (git-ignored): .env.secrets
try {
  writeFileSync(".env.secrets", lines + "\n");
  console.log("💾 Also written to .env.secrets (verify it is git-ignored!).");
} catch {
  // read-only FS — printing above is enough
}
