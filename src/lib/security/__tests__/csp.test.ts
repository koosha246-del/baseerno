import { describe, it, expect } from "vitest";
import { buildCsp, generateNonce } from "../csp";

describe("buildCsp", () => {
  it("uses a nonce and NO unsafe-inline/unsafe-eval in script-src in production", () => {
    const csp = buildCsp({ nonce: "abc123nonce", isDev: false });
    // Scope to the script-src directive: style-src legitimately keeps
    // 'unsafe-inline' (Next.js inline styles), so asserting on the whole
    // header would be a false negative.
    const scriptSrc = csp.match(/script-src ([^;]+)/)?.[1] ?? "";

    expect(scriptSrc).toContain("'nonce-abc123nonce'");
    expect(scriptSrc).toContain("'strict-dynamic'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("default-src 'self'");
  });

  it("keeps GA hosts in script-src so gtag keeps working", () => {
    const csp = buildCsp({ nonce: "n", isDev: false });
    expect(csp).toContain("https://www.googletagmanager.com");
    expect(csp).toContain("https://www.google-analytics.com");
  });

  it("allows unsafe-inline + unsafe-eval only in development", () => {
    const devCsp = buildCsp({ nonce: "n", isDev: true });
    expect(devCsp).toContain("'unsafe-inline'");
    expect(devCsp).toContain("'unsafe-eval'");
    // No nonce needed in dev (scripts are inline-allowed).
    expect(devCsp).not.toContain("'nonce-");

    const prodCsp = buildCsp({ nonce: "n", isDev: false });
    expect(prodCsp).toContain("'nonce-n'");
    expect(prodCsp).not.toContain("'unsafe-eval'");
  });

  it("keeps worker-src blob: so Sentry Replay can run", () => {
    const csp = buildCsp({ nonce: "n", isDev: false });
    expect(csp).toContain("worker-src 'self' blob:");
  });

  it("allows YouTube/Vimeo lesson embeds via frame-src", () => {
    const csp = buildCsp({ nonce: "n", isDev: false });
    const frameSrc = csp.match(/frame-src ([^;]+)/)?.[1] ?? "";
    expect(frameSrc).toContain("https://www.youtube.com");
    expect(frameSrc).toContain("https://player.vimeo.com");
    // No blanket https: for frames — only the scoped embed hosts.
    expect(frameSrc).not.toBe("https:");
    expect(frameSrc.split(" ")).not.toContain("https:");
  });

  it("allows native video from any CDN via media-src", () => {
    const csp = buildCsp({ nonce: "n", isDev: false });
    expect(csp).toContain("media-src 'self' https:");
  });
});

describe("generateNonce", () => {
  it("returns a unique base64-ish string per call", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(16);
  });
});
