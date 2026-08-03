/**
 * Edge caching policy for public marketing pages.
 *
 * Public pages (homepage, catalog, course detail, library, legal pages)
 * are identical for every visitor — the auth-aware header (ورود / پنل
 * کاربری) is rendered client-side in HeaderActions, so the server HTML
 * shell is safe to cache at the CDN edge.
 *
 * Rules:
 *   - Only GET requests.
 *   - Only public cacheable paths (see PUBLIC_CACHEABLE).
 *   - Logged-in users are never served a public cache entry (private),
 *     in case the shell ever becomes user-aware.
 *   - Auth pages, dashboard, /api and the lesson player (/learn, which
 *     requires an enrollment) are excluded entirely.
 *
 * The s-maxage matches the ISR `revalidate = 300` on the homepage and
 * catalog, so the middleware hint and Next.js ISR agree on freshness.
 */

/** Seconds the edge may serve the cached HTML (matches ISR revalidate). */
export const PUBLIC_CACHE_MAX_AGE = 300;

const PUBLIC_CACHEABLE: RegExp[] = [
  /^\/$/, // homepage (ISR revalidate=300)
  /^\/courses$/, // catalog (ISR revalidate=300)
  /^\/courses\/[^/]+$/, // course detail (ISR revalidate=3600)
  /^\/library(?:\/.*)?$/,
  /^\/about$/,
  /^\/contact$/,
  /^\/privacy$/,
  /^\/terms$/,
  /^\/kids-preview$/,
  /^\/scroll-animation$/,
  /^\/offline$/,
];

/** Paths that must never be cached at the edge. */
const NEVER_CACHE_PREFIXES = [
  "/dashboard",
  "/api/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

/**
 * Compute the Cache-Control header for a page response, or null when the
 * response should be left untouched (non-public, non-GET, unknown path).
 */
export function publicPageCacheControl(
  pathname: string,
  method: string,
  hasAuthCookie: boolean,
): string | null {
  if (method !== "GET") return null;

  if (NEVER_CACHE_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  // Lesson player is auth-required — never cache.
  if (pathname.includes("/learn")) return null;

  if (!PUBLIC_CACHEABLE.some((re) => re.test(pathname))) return null;

  // Logged-in visitors get the live shell, never a shared cache entry.
  if (hasAuthCookie) return "private, no-store";

  return `public, s-maxage=${PUBLIC_CACHE_MAX_AGE}, stale-while-revalidate=${PUBLIC_CACHE_MAX_AGE}`;
}
