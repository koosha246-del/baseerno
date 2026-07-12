import { cookies } from "next/headers";
import { AUTH_COOKIE, signToken, verifyToken, type AuthToken } from "./jwt";
import { repository } from "@/lib/db/repository";
import type { SafeUser } from "@/lib/db/types";

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
    secure: process.env.NODE_ENV === "production",
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

/** Return the current safe user, or null when not authenticated. */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return repository.findSafeUserById(token.sub);
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
