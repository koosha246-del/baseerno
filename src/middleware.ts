import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth/jwt";

/**
 * Edge middleware — lightweight gate for /dashboard/* routes.
 *
 * In the edge runtime we only check for the cookie's PRESENCE. The real,
 * cryptographic verification (jwt.verify) happens in the server-side
 * dashboard layout via getCurrentUser(). If the token is invalid, the
 * layout redirects to /login.
 *
 * (jsonwebtoken uses Node APIs that the edge runtime doesn't fully support,
 * so we keep verification on the Node side.)
 */
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
