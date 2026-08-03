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
    optimizePackageImports: ["lucide-react", "framer-motion"],
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
          // Content-Security-Policy is intentionally NOT set here — it is
          // generated per-request in src/middleware.ts with a fresh nonce
          // (script-src 'nonce-<n>' 'strict-dynamic' in production, no
          // 'unsafe-inline'). A static header here would not carry the
          // nonce and would conflict with the dynamic one.
        ],
      },
    ];
  },
};

export default nextConfig;
