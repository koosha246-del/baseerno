import jwt, { type JwtPayload } from "jsonwebtoken";

/**
 * Short-lived signed tokens that grant a one-time download of a paid book.
 *
 * We use the same JWT secret as auth tokens so the site has a single trust
 * root, but a different payload shape so the two can never be confused.
 * Tokens expire after 30 days — long enough for legitimate repeat downloads,
 * short enough that a leaked URL stops working eventually.
 */

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production.");
    }
    return "dev-only-insecure-secret-do-not-use-in-production";
  }
  return secret;
}

const EXPIRES_IN = "30d";

export interface DownloadToken extends JwtPayload {
  /** Book identifier, matches `Book.id` in `src/lib/library.ts`. */
  bookId: string;
  /** Opaque purchase reference (in production: Payment.id). */
  purchaseId: string;
  /** Authoritative cost at time of purchase, prevents price tampering. */
  amount: number;
}

export function signDownloadToken(
  payload: Omit<DownloadToken, "iat" | "exp">,
): string {
  return jwt.sign(payload, getSecret(), { expiresIn: EXPIRES_IN });
}

export function verifyDownloadToken(token: string): DownloadToken | null {
  try {
    return jwt.verify(token, getSecret()) as DownloadToken;
  } catch {
    return null;
  }
}
