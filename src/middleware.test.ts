import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Middleware reads NODE_ENV to pick the dev vs prod CSP.
vi.stubEnv("NODE_ENV", "production");

import { middleware } from "./middleware";

// Don't leak the stubbed NODE_ENV into other test files.
afterEach(() => {
  vi.unstubAllEnvs();
});

function makeRequest(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers });
}

describe("middleware security headers", () => {
  it("adds a nonce-based CSP header to page responses", () => {
    const res = middleware(makeRequest("https://baseerno.ir/"));
    const csp = res.headers.get("Content-Security-Policy") ?? "";
    // Scope to script-src: style-src keeps 'unsafe-inline' for Next.js
    // inline styles, so checking the whole header would be a false negative.
    const scriptSrc = csp.match(/script-src ([^;]+)/)?.[1] ?? "";
    expect(scriptSrc).toContain("'nonce-");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it("adds the CSP header to API responses too", () => {
    const res = middleware(makeRequest("https://baseerno.ir/api/auth/me"));
    expect(res.headers.get("Content-Security-Policy")).toContain("script-src");
    expect(res.headers.get("Content-Security-Policy")).toContain("'nonce-");
  });

  it("uses a unique nonce per request (no reuse across responses)", () => {
    const csp1 =
      middleware(makeRequest("https://baseerno.ir/")).headers.get(
        "Content-Security-Policy",
      ) ?? "";
    const nonce1 = csp1.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce1).toBeTruthy();

    const csp2 =
      middleware(makeRequest("https://baseerno.ir/")).headers.get(
        "Content-Security-Policy",
      ) ?? "";
    const nonce2 = csp2.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce2).toBeTruthy();
    expect(nonce1).not.toBe(nonce2);
  });

  it("preserves the unauthenticated /dashboard redirect", () => {
    const res = middleware(makeRequest("https://baseerno.ir/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
    // Redirect responses still get the CSP header.
    expect(res.headers.get("Content-Security-Policy")).toContain("'nonce-");
  });
});

