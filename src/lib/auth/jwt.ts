import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "@/lib/env";

/**
 * JWT helpers — sign/verify auth tokens.
 * Token payload carries the minimal identity needed by the dashboard.
 */

function getSecret(): string {
  return env.jwtSecret;
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
  try {
    const decoded = jwt.verify(token, getSecret()) as AuthToken;
    return decoded;
  } catch {
    return null;
  }
}

export const AUTH_COOKIE = "bn_session";
