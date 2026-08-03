/**
 * Content Security Policy builder + nonce generator.
 *
 * Production: `script-src` is locked down with a per-request nonce and
 * `'strict-dynamic'` — NO `'unsafe-inline'` for scripts. Next.js applies
 * the `x-nonce` request header to its own inline scripts automatically.
 *
 * Development: Next.js dev tooling (Fast Refresh, webpack HMR, error
 * overlay) requires inline + eval, so the CSP is relaxed in dev only.
 *
 * The remaining directives stay compatible with the stack:
 *   - style-src 'unsafe-inline'  → Next.js inline <style> / next-themes
 *   - img-src https:             → Cloudinary / Unsplash images
 *   - connect-src https:         → Sentry ingest, GA beacons
 *   - worker-src blob:           → Sentry Replay worker
 *   - frame-src (embed hosts)    → YouTube / Vimeo lesson embeds
 *   - media-src https:           → native <video> from any CDN
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
 * Generate a fresh CSP nonce per request.
 *
 * Edge-safe: uses Web Crypto (`crypto.randomUUID`) + `btoa` — no Node
 * `Buffer`/`crypto.randomBytes` dependency (middleware runs on the edge).
 */
export function generateNonce(): string {
  const uuid = crypto.randomUUID();
  return btoa(uuid).replace(/[+/=]/g, "").slice(0, 32);
}

export interface BuildCspOptions {
  nonce: string;
  isDev: boolean;
}

/**
 * Build the full CSP header value.
 *
 * - Production: `script-src 'self' 'nonce-<n>' 'strict-dynamic' <hosts>`.
 *   GA is loaded via next/script with the same nonce, so it keeps working.
 * - Development: adds back `'unsafe-inline' 'unsafe-eval'` for HMR.
 */
export function buildCsp({ nonce, isDev }: BuildCspOptions): string {
  const scriptSrc = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval' ${SCRIPT_HOSTS}`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' ${SCRIPT_HOSTS}`;

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https:`,
    `worker-src 'self' blob:`,
    `frame-src ${FRAME_HOSTS}`,
    `media-src 'self' https:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
  ].join("; ");
}
