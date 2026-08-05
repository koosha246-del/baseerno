import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth/jwt";
import { publicPageCacheControl } from "@/lib/cache-control";

/**
 * Edge middleware — two responsibilities:
 *
 * 1. Authentication + basic role gate for /dashboard/*.
 *
 * 2. Cache-Control for public marketing pages (see src/lib/cache-control.ts).
 *
 * Content-Security-Policy is NOT set here anymore — it is applied as a
 * static header in next.config.mjs. The previous per-request nonce CSP
 * (`script-src 'nonce-<n>' 'strict-dynamic'`) was incompatible with ISR:
 * cached HTML keeps the nonce baked in at render time while every request
 * got a fresh nonce on the CSP header, so cache hits silently blocked ALL
 * scripts. Per-request nonces require dynamic rendering, which would
 * defeat ISR. See the comment in next.config.mjs for the trade-off.
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

/**
 * Build the response with the cache-control policy for the path.
 * Auth-gated and API paths are left untouched by the policy helper.
 */
function securityResponse(req: NextRequest): NextResponse {
  const response = NextResponse.next();

  // Edge caching: public marketing pages get a CDN-friendly Cache-Control;
  // dashboard/auth/API/lesson-player paths are left untouched (or private
  // for logged-in users). See src/lib/cache-control.ts for the policy.
  const cacheControl = publicPageCacheControl(
    req.nextUrl.pathname,
    req.method,
    Boolean(req.cookies.get(AUTH_COOKIE)?.value),
  );
  if (cacheControl) {
    response.headers.set("Cache-Control", cacheControl);
  }

  return response;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return securityResponse(req);
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

  return securityResponse(req);
}

export const config = {
  // Run on everything except static assets — including API routes so
  // API responses also carry the security headers.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|sw.js).*)"],
};
