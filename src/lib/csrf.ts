import { siteConfig } from "@/config/site";

/**
 * CSRF protection for cookie-authenticated state-changing requests.
 *
 * In **production** we verify the Origin or Referer header against our known
 * site host. This prevents a malicious third-party site from submitting
 * requests that carry the user's session cookie.
 *
 * In **development** the check is relaxed (always passes) because:
 * - Same-site cookies already protect against the most common CSRF vectors.
 * - Local dev servers (localhost, 127.0.0.1) often have varying Origin
 *   formats across browsers and tools, causing false positives.
 * - There is nothing to steal on a local-only dev server.
 *
 * The real CSRF protection in production comes from:
 * 1. `sameSite: lax` on the session cookie (blocks most cross-site POSTs).
 * 2. This origin check (catches edge cases like subdomain attacks).
 */

const ALLOWED_HOSTS = new Set<string>();

function allowedOrigins(): Set<string> {
  if (ALLOWED_HOSTS.size > 0) return ALLOWED_HOSTS;

  // Production host from site config (e.g. "baseerno.ir")
  const base = new URL(siteConfig.url);
  ALLOWED_HOSTS.add(base.host);

  // Allow Vercel preview deployments of this project.
  if (base.hostname.endsWith("vercel.app")) {
    ALLOWED_HOSTS.add(base.hostname);
  }

  return ALLOWED_HOSTS;
}

/**
 * Validate that the request originates from the same site.
 * Returns `true` when the request is allowed, `false` when it should be rejected.
 */
export function isSameOriginRequest(req: Request): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const url = origin ?? referer;

  // In development, allow localhost requests (varying origin formats).
  // Staging/preview deployments that handle real user data enforce CSRF.
  if (process.env.NODE_ENV !== "production" && url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        return true;
      }
    } catch { /* fall through to enforce CSRF */ }
  }

  const allowed = allowedOrigins();

  // Prefer Origin header.
  if (origin) {
    try {
      const parsedOrigin = new URL(origin);
      return allowed.has(parsedOrigin.host);
    } catch {
      return false;
    }
  }

  // Fall back to Referer header.
  if (referer) {
    try {
      const parsedReferer = new URL(referer);
      return allowed.has(parsedReferer.host);
    } catch {
      return false;
    }
  }

  // No Origin and no Referer: reject.
  return false;
}

/**
 * Standard 403 JSON response for rejected CSRF checks.
 */
export function csrfRejectedResponse(message = "درخواست از مبدا نامعتبر است.") {
  return Response.json({ error: message }, { status: 403 });
}
