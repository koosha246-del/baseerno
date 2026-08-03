import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "@/lib/env";

/**
 * JWT helpers — sign/verify auth tokens.
 * Token payload carries the minimal identity needed by the dashboard.
 */

function getSecret(): string {
  return env.jwtSecret;
}

/**
 * Secrets accepted for verification. During key rotation the old secret
 * is set via `JWT_SECRET_OLD` so already-issued tokens stay valid until
 * they expire; after the rotation window you remove the old var.
 */
function getVerifySecrets(): string[] {
  const secrets = [getSecret()];
  if (env.JWT_SECRET_OLD) secrets.push(env.JWT_SECRET_OLD);
  return secrets;
}

const EXPIRES_IN = "7d";

export interface AuthToken extends JwtPayload {
  sub: string; // user id
  role: string; // STUDENT | TEACHER | ADMIN
  email: string;
}

export function signToken(payload: Omit<AuthToken, "iat" | "exp">): string {
  return jwt.sign(payload, getSecret(), { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): AuthToken | null {
  for (const secret of getVerifySecrets()) {
    try {
      return jwt.verify(token, secret) as AuthToken;
    } catch {
      // Try the next secret (old key during rotation).
    }
  }
  return null;
}

export const AUTH_COOKIE = "bn_session";
