import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

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
 * with. When Zarinpal is enabled, live verify uses the gateway's own API
 * instead of (or in addition to) this HMAC path.
 */

function getSecret(): string {
  return env.paymentSignatureSecret;
}

/** Secrets accepted for verification (current + previous during rotation). */
function getVerifySecrets(): string[] {
  const secrets = [getSecret()];
  if (env.PAYMENT_SIGNATURE_SECRET_OLD) secrets.push(env.PAYMENT_SIGNATURE_SECRET_OLD);
  return secrets;
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
  for (const secret of getVerifySecrets()) {
    const expected = createHmac("sha256", secret).update(paymentId).digest("hex");
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    if (a.length !== b.length || b.length === 0) continue;
    try {
      if (timingSafeEqual(a, b)) return true;
    } catch {
      continue;
    }
  }
  return false;
}

/** Build the full authenticated callback URL for a payment. */
export function buildCallbackUrl(paymentId: string): string {
  const sig = signPaymentId(paymentId);
  return `/api/checkout/callback?paymentId=${paymentId}&sig=${sig}`;
}
