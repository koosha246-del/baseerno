import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth/jwt";
import { buildCsp, generateNonce } from "@/lib/security/csp";
import { publicPageCacheControl } from "@/lib/cache-control";

/**
 * Edge middleware — two responsibilities:
 *
 * 1. Security headers (CSP with a per-request nonce)
 *    Every response gets a `Content-Security-Policy` whose `script-src`
 *    carries a fresh `'nonce-<n>'` (production) — no `'unsafe-inline'`.
 *    The nonce is ALSO forwarded as the `x-nonce` request header so
 *    Next.js stamps it onto its own inline scripts automatically, and the
 *    root layout can read it for GA / inline JSON-LD.
 *
 * 2. Authentication + basic role gate for /dashboard/* (unchanged).
 *
 * Security note: the nonce must be unique per response — it is generated
 * inside the handler, so concurrent requests never share one.
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
 * Build the response, forwarding the nonce as the `x-nonce` request header
 * (documented Next.js pattern: `NextResponse.next({ request: { headers } })`)
 * and stamping the CSP response header.
 */
function securityResponse(req: NextRequest, nonce: string): NextResponse {
  const isDev = process.env.NODE_ENV === "development";

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", buildCsp({ nonce, isDev }));

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

/** Attach the CSP header to a redirect/error response. */
function withCspHeader(response: NextResponse, nonce: string): NextResponse {
  const isDev = process.env.NODE_ENV === "development";
  response.headers.set("Content-Security-Policy", buildCsp({ nonce, isDev }));
  return response;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Fresh nonce per request — every branch below uses the same one.
  const nonce = generateNonce();

  if (!pathname.startsWith("/dashboard")) {
    return securityResponse(req, nonce);
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withCspHeader(NextResponse.redirect(loginUrl), nonce);
  }

  // Role-based route guarding (Edge-compatible: decode without verify)
  const payload = decodeTokenPayload(token);
  const role = payload?.role;

  if (role) {
    for (const route of ADMIN_ROUTES) {
      if (pathname.startsWith(route) && role !== "ADMIN") {
        return withCspHeader(
          NextResponse.redirect(new URL("/dashboard", req.url)),
          nonce,
        );
      }
    }
    for (const route of TEACHER_ROUTES) {
      if (pathname.startsWith(route) && role !== "TEACHER" && role !== "ADMIN") {
        return withCspHeader(
          NextResponse.redirect(new URL("/dashboard", req.url)),
          nonce,
        );
      }
    }
  }

  return securityResponse(req, nonce);
}

export const config = {
  // Run on everything except static assets — including API routes so
  // API responses also carry the CSP header (per acceptance criteria).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|sw.js).*)"],
};
