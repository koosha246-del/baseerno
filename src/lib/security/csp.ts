/**
 * Content Security Policy — static policy builder.
 *
 * The policy is applied as a STATIC header via `next.config.mjs` (headers()
 * for every route). It is defined here as a single source of truth and
 * covered by unit tests; keep `buildStaticCsp()` in sync with the header
 * string in next.config.mjs.
 *
 * Why static instead of per-request nonces?
 * -----------------------------------------
 * The app relies on ISR / full-route caching (homepage + course pages use
 * `revalidate`). A per-request nonce CSP (`script-src 'nonce-<n>'
 * 'strict-dynamic'`) breaks under caching: the cached HTML keeps the nonce
 * baked in at render time, while every response gets a FRESH nonce on the
 * CSP header — they never match on cache hits, so all scripts are blocked.
 * Per-request nonces require dynamic rendering, which would defeat ISR.
 *
 * Static policy keeps the rest locked down (object-src 'none',
 * frame-ancestors 'none', base-uri 'self', …) and allows 'unsafe-inline'
 * for scripts — the standard trade-off for ISR-heavy Next.js apps. GA hosts
 * stay explicit because external scripts are not 'self'.
 */

const SCRIPT_HOSTS =
  "https://www.googletagmanager.com https://www.google-analytics.com";

/**
 * Frame hosts for the lesson VideoPlayer embeds. Scoped to the known
 * embed providers — NOT a blanket `https:` — so the hardening holds.
 */
const FRAME_HOSTS =
  "https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com";

/**
 * Build the full static CSP header value (production and dev identical —
 * dev tooling is compatible with 'unsafe-inline').
 */
export function buildStaticCsp(): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${SCRIPT_HOSTS}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "worker-src 'self' blob:",
    `frame-src ${FRAME_HOSTS}`,
    "media-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}
