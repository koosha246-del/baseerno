import { describe, it, expect } from "vitest";
import { buildStaticCsp } from "../csp";

describe("buildStaticCsp", () => {
  it("keeps script-src functional for ISR-heavy Next.js: 'unsafe-inline' + GA hosts", () => {
    const csp = buildStaticCsp();
    const scriptSrc = csp.match(/script-src ([^;]+)/)?.[1] ?? "";

    // Per-request nonces are incompatible with ISR caching (cached HTML
    // nonce vs fresh header nonce never match on cache hits), so the
    // static policy allows inline scripts instead.
    expect(scriptSrc).toContain("'unsafe-inline'");
    expect(scriptSrc).toContain("https://www.googletagmanager.com");
    expect(scriptSrc).toContain("https://www.google-analytics.com");
    // No stale nonce machinery left behind.
    expect(scriptSrc).not.toContain("'nonce-");
    expect(scriptSrc).not.toContain("'strict-dynamic'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it("keeps the rest of the policy locked down", () => {
    const csp = buildStaticCsp();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("keeps worker-src blob: so Sentry Replay can run", () => {
    const csp = buildStaticCsp();
    expect(csp).toContain("worker-src 'self' blob:");
  });

  it("allows YouTube/Vimeo lesson embeds via frame-src", () => {
    const csp = buildStaticCsp();
    const frameSrc = csp.match(/frame-src ([^;]+)/)?.[1] ?? "";
    expect(frameSrc).toContain("https://www.youtube.com");
    expect(frameSrc).toContain("https://player.vimeo.com");
    // No blanket https: for frames — only the scoped embed hosts.
    expect(frameSrc.split(" ")).not.toContain("https:");
  });

  it("allows native video from any CDN via media-src", () => {
    const csp = buildStaticCsp();
    expect(csp).toContain("media-src 'self' https:");
  });
});
