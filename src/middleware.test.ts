import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "./middleware";

// Don't leak any stubbed env into other test files.
afterEach(() => {
  vi.unstubAllEnvs();
});

function makeRequest(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers });
}

describe("middleware", () => {
  it("does NOT set Content-Security-Policy (applied statically via next.config headers)", () => {
    // The per-request nonce CSP was removed because it is incompatible
    // with ISR caching (cached HTML nonce vs fresh header nonce never
    // match on cache hits → all scripts blocked). The static CSP lives
    // in next.config.mjs headers().
    const res = middleware(makeRequest("https://baseerno.ir/"));
    expect(res.headers.get("Content-Security-Policy")).toBeNull();
  });

  it("sets a public Cache-Control on marketing pages", () => {
    const res = middleware(makeRequest("https://baseerno.ir/"));
    expect(res.headers.get("Cache-Control")).toContain("s-maxage");
  });

  it("preserves the unauthenticated /dashboard redirect", () => {
    const res = middleware(makeRequest("https://baseerno.ir/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("lets authenticated users through to /dashboard", () => {
    // Minimal fake JWT: header.payload.signature (payload = { role: "STUDENT" })
    const payload = btoa(JSON.stringify({ role: "STUDENT" }));
    const res = middleware(
      makeRequest("https://baseerno.ir/dashboard", {
        cookie: `bn_session=abc.${payload}.sig`,
      }),
    );
    expect(res.status).toBe(200);
  });

  it("redirects non-ADMIN users away from /dashboard/users", () => {
    const payload = btoa(JSON.stringify({ role: "STUDENT" }));
    const res = middleware(
      makeRequest("https://baseerno.ir/dashboard/users", {
        cookie: `bn_session=abc.${payload}.sig`,
      }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard");
  });
});
