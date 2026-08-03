/**
 * Edge-compatible JWT helpers — HMAC-SHA256 verification via Web Crypto API.
 *
 * The `jsonwebtoken` package requires Node.js `crypto` which is unavailable
 * in Edge runtime. This module uses `crypto.subtle` (Web Crypto API) which
 * is available in all edge runtimes (Vercel Edge, Cloudflare Workers, etc.).
 *
 * Used exclusively by `src/middleware.ts` for token signature verification
 * at the edge before the request reaches a server component.
 */

// ─── Base64URL helpers ─────────────────────────────────────────────

function base64UrlToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  // Explicit ArrayBuffer (not ArrayBufferLike) so the result is
  // assignable to `BufferSource` in TS 5.7+'s strict WebCrypto types.
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ─── Types ─────────────────────────────────────────────────────────

export interface EdgeAuthToken {
  sub: string;
  role: string;
  email: string;
  iat: number;
  exp: number;
}

// ─── Secret import ─────────────────────────────────────────────────

let cachedKey: CryptoKey | null = null;

async function getKey(secret: string): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const encoder = new TextEncoder();
  cachedKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  return cachedKey;
}

// ─── Verify ────────────────────────────────────────────────────────

/**
 * Verify a JWT token's HMAC-SHA256 signature using the Web Crypto API.
 *
 * Returns the decoded payload on success, or `null` if:
 * - The token format is invalid (not 3 dot-separated parts)
 * - The signature does not match
 * - The token has expired
 * - The secret is not configured
 *
 * **Important**: This does NOT replace server-side verification in
 * `src/lib/auth/jwt.ts` (which uses `jsonwebtoken` with full features).
 * This is a lightweight edge check for role-based routing only.
 */
export async function verifyTokenEdge(
  token: string,
): Promise<EdgeAuthToken | null> {
  try {
    // 1. Validate token structure
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

    // 2. Validate header algorithm
    const header = JSON.parse(atob(headerB64));
    if (header.alg !== "HS256") return null;

    // 3. Read the secret from environment
    //    In edge runtime, process.env is available but only for
    //    vars prefixed with NEXT_PUBLIC_ or explicitly opted-in.
    //    JWT_SECRET must be available at the edge — Next.js handles this
    //    when the variable is read in middleware.
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    // 4. Import the HMAC key
    const key = await getKey(secret);

    // 5. Verify signature
    const encoder = new TextEncoder();
    // Copy through a plain ArrayBuffer so both arrays are
    // `Uint8Array<ArrayBuffer>` (BufferSource-compatible) under
    // TS 5.7+'s strict WebCrypto types.
    const rawData = encoder.encode(`${headerB64}.${payloadB64}`);
    const data = new Uint8Array(new ArrayBuffer(rawData.length));
    data.set(rawData);
    const signature = base64UrlToUint8Array(signatureB64);

    const valid = await crypto.subtle.verify("HMAC", key, signature, data);
    if (!valid) return null;

    // 6. Decode and validate payload
    const payload: Record<string, unknown> = JSON.parse(atob(payloadB64));

    // Check expiration
    if (typeof payload.exp === "number" && payload.exp < Date.now() / 1000) {
      return null;
    }

    return {
      sub: payload.sub as string,
      role: payload.role as string,
      email: payload.email as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}
