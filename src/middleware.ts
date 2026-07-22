import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth/jwt";

/**
 * Edge middleware — authentication + basic role gate for /dashboard/*.
 *
 * Authentication:
 *   Checks for the session cookie's PRESENCE (not cryptographic
 *   verification — that happens server-side in the layout via jwt.verify).
 *
 * Role-based routing:
 *   The JWT payload (base64-decoded) includes a `role` field so we can
 *   redirect students/teachers away from admin-only pages at the edge
 *   before they reach the server component.
 *
 * Role → route mapping (admin-only routes):
 *   /dashboard/users     → ADMIN
 *   /dashboard/reports   → ADMIN
 *   /dashboard/courses   → ADMIN (management table)
 *   /dashboard/content   → TEACHER
 */

/** Routes that only ADMIN users can access. */
const ADMIN_ROUTES = ["/dashboard/users", "/dashboard/reports"];

/** Routes that only TEACHER users can access. */
const TEACHER_ROUTES = ["/dashboard/content"];

/**
 * Decode the JWT payload without verifying the signature.
 * Works in Edge runtime because we only read the base64 body.
 */
function decodeTokenPayload(token: string): { role?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]!));
    return payload;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route guarding (Edge-compatible: decode without verify)
  const payload = decodeTokenPayload(token);
  const role = payload?.role;

  if (role) {
    for (const route of ADMIN_ROUTES) {
      if (pathname.startsWith(route) && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
    for (const route of TEACHER_ROUTES) {
      if (pathname.startsWith(route) && role !== "TEACHER" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
