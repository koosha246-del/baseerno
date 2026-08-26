/**
 * TOTP (RFC 6238) — dependency-free implementation using node:crypto.
 *
 * Provides:
 *  - generateSecret(): random base32 secret for QR provisioning
 *  - generateCode(secret): current 6-digit code (with ±1 window support)
 *  - verifyCode(secret, code): constant-time-ish check across ±1 step
 *
 * The `secret` is the base32-encoded key (as displayed in authenticator
 * apps). Compatible with Google Authenticator / Authy.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Encode bytes to base32 (no padding). */
function base32Encode(buffer: Buffer): string {
  let bits = "";
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  return out;
}

/** Decode a base32 string (case-insensitive, ignores padding/spaces). */
function base32Decode(input: string): Buffer {
  const cleaned = input.replace(/[=\s]/g, "").toUpperCase();
  let bits = "";
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error("Invalid base32 character");
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

const STEP_SECONDS = 30;
const DIGITS = 6;

/** Generate a new random base32 secret (20 bytes → 160-bit key). */
export function generateSecret(): string {
  return base32Encode(randomBytes(20));
}

/** Compute the TOTP code for a secret at a given unix-time step. */
export function generateCode(secret: string, time = Date.now()): string {
  const counter = Math.floor(time / 1000 / STEP_SECONDS);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));

  const key = base32Decode(secret);
  const hmac = createHmac("sha1", key).update(counterBuf).digest();

  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

/**
 * Verify a submitted code. Accepts a ±1 step drift (30s window each side)
 * to tolerate clock skew between the server and the authenticator app.
 */
export function verifyCode(secret: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const now = Date.now();
  for (let drift = -1; drift <= 1; drift++) {
    const candidate = generateCode(secret, now + drift * STEP_SECONDS * 1000);
    // Constant-time compare to avoid leaking timing on the code.
    const a = Buffer.from(candidate, "utf8");
    const b = Buffer.from(code, "utf8");
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

/** Build an otpauth:// URI for QR provisioning in a 2FA setup screen. */
export function buildOtpauthUri(secret: string, accountName: string, issuer = "بصیر نو"): string {
  return (
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}` +
    `?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
  );
}
