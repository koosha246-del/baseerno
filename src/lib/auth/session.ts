import { cookies } from "next/headers";
import { AUTH_COOKIE, signToken, verifyToken, type AuthToken } from "./jwt";
import { repository } from "@/lib/db/repository";
import type { SafeUser } from "@/lib/db/types";
import { env } from "@/lib/env";
import {
  findDemoAccountById,
  demoAccountToSafeUser,
} from "./demo-users";

/**
 * Session helpers — read/set/clear the httpOnly auth cookie.
 * Server-only (uses next/headers).
 */

/** Set the session cookie on a successful login/register. */
export async function setSession(user: Pick<SafeUser, "id" | "role" | "email">) {
  const token = signToken({ sub: user.id, role: user.role, email: user.email });
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/** Clear the session cookie (logout). */
export async function clearSession() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}

/** Read + verify the current token, returning the decoded payload. */
export async function getAuthToken(): Promise<AuthToken | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Return the current safe user, or null when not authenticated.
 *
 * In demo mode (DEMO_MODE=true) the user is resolved from the built-in
 * demo accounts by token subject — no database round-trip — so the app
 * keeps working when PostgreSQL is down.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = await getAuthToken();
  if (!token) return null;

  // Demo mode: resolve demo tokens without a DB round-trip. Tokens that
  // belong to a REAL user (e.g. Postgres was connected at some point and
  // a real account logged in) must fall through to the database below —
  // otherwise real users would be locked out while DEMO_MODE stays true.
  if (env.demoMode) {
    const demo = findDemoAccountById(token.sub);
    if (demo) return demoAccountToSafeUser(demo);
  }

  try {
    return await repository.findSafeUserById(token.sub);
  } catch (err) {
    // DB unreachable: only demo tokens can resolve; real tokens rethrow
    // so callers can decide (layouts already catch and redirect).
    const demo = findDemoAccountById(token.sub);
    if (demo) return demoAccountToSafeUser(demo);
    throw err;
  }
}

/**
 * Require an authenticated user — throw a redirect to /login when absent.
 * Use at the top of any (dashboard) server component or layout.
 */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}
