import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Payment signature helpers.
 *
 * The simulated gateway callback must be authenticated so that an attacker
 * cannot confirm an unpaid order by simply visiting
 * `/api/checkout/callback?paymentId=<id>`. We do this by signing the payment
 * id with an HMAC of the configured secret and requiring that signature on
 * the way back. This mirrors how a real gateway returns a checksum we verify.
 *
 * The signature proves the callback URL was produced by our own checkout
 * endpoint (which already authenticated the user) and has not been tampered
 * with. It is *not* a replacement for a real gateway's server-to-server
 * verification — that still needs to be wired up before going live with a
 * real provider.
 */

function getSecret(): string {
  const secret = process.env.PAYMENT_SIGNATURE_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "PAYMENT_SIGNATURE_SECRET environment variable is required in production."
      );
    }
    // Stable dev-only fallback so the flow works locally without config.
    return "dev-only-insecure-payment-secret";
  }
  return secret;
}

/** Sign a payment id with the configured secret. */
export function signPaymentId(paymentId: string): string {
  return createHmac("sha256", getSecret()).update(paymentId).digest("hex");
}

/**
 * Constant-time comparison of two hex signatures.
 * Returns false if lengths differ (which would otherwise throw).
 */
export function verifyPaymentSignature(paymentId: string, signature: string): boolean {
  const expected = signPaymentId(paymentId);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length || b.length === 0) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Build the full authenticated callback URL for a payment. */
export function buildCallbackUrl(paymentId: string): string {
  const sig = signPaymentId(paymentId);
  return `/api/checkout/callback?paymentId=${paymentId}&sig=${sig}`;
}
