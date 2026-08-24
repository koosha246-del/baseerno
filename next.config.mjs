import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Required by Dockerfile (railway deploy): the runner stage only ships
  // the standalone output (.next/standalone + server.js).
  output: "standalone",
  // Pin the tracing root to THIS directory — otherwise Next infers the
  // workspace root from the git worktree location and the standalone
  // output lands in the wrong folder (breaks the Docker build).
  outputFileTracingRoot: __dirname,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Content-Security-Policy is set here as a STATIC header.
          //
          // Why not a per-request nonce (as before)? The app relies on ISR /
          // full-route caching (revalidate=300 on the homepage, course pages,
          // …). A cached HTML response keeps the nonce baked in at render
          // time, while the middleware stamps a FRESH nonce on every
          // response's CSP header — the two never match on cache hits, so
          // `script-src 'nonce-<n>' 'strict-dynamic'` silently blocks ALL
          // scripts (broken hydration, no JS). Per-request nonces require
          // dynamic rendering, which would defeat ISR entirely.
          //
          // Static policy keeps the rest locked down (object-src 'none',
          // frame-ancestors 'none', base-uri 'self', …) and allows
          // 'unsafe-inline' for scripts — the standard trade-off for
          // ISR-heavy Next.js apps. GA hosts stay explicit because external
          // scripts are not 'self'.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "worker-src 'self' blob:",
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
              "media-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
