import { describe, it, expect, afterEach } from "vitest";
import { isSameOriginRequest, csrfRejectedResponse } from "../csrf";

// `process.env.NODE_ENV` is typed as a literal union and therefore
// readonly; we cast through a mutable view so tests can flip it.
const env = process.env as Record<string, string | undefined>;

describe("isSameOriginRequest", () => {
  const original = env.NODE_ENV;

  afterEach(() => {
    if (original === undefined) {
      delete env.NODE_ENV;
    } else {
      env.NODE_ENV = original;
    }
  });

  it("returns true in development regardless of origin", () => {
    env.NODE_ENV = "development";
    const req = new Request("https://example.com/api", {
      method: "POST",
      headers: { origin: "https://evil.com" },
    });
    expect(isSameOriginRequest(req)).toBe(true);
  });

  it("returns true in test environment", () => {
    env.NODE_ENV = "test";
    const req = new Request("https://example.com/api", {
      method: "POST",
      headers: { origin: "https://anywhere.com" },
    });
    expect(isSameOriginRequest(req)).toBe(true);
  });

  it("accepts matching Origin in production", () => {
    env.NODE_ENV = "production";
    const req = new Request("https://baseerno.ir/api", {
      method: "POST",
      headers: { origin: "https://baseerno.ir" },
    });
    expect(isSameOriginRequest(req)).toBe(true);
  });

  it("rejects foreign Origin in production", () => {
    env.NODE_ENV = "production";
    const req = new Request("https://baseerno.ir/api", {
      method: "POST",
      headers: { origin: "https://evil.com" },
    });
    expect(isSameOriginRequest(req)).toBe(false);
  });

  it("falls back to Referer when Origin missing", () => {
    env.NODE_ENV = "production";
    const req = new Request("https://baseerno.ir/api", {
      method: "POST",
      headers: { referer: "https://baseerno.ir/page" },
    });
    expect(isSameOriginRequest(req)).toBe(true);
  });

  it("rejects Referer from foreign host", () => {
    env.NODE_ENV = "production";
    const req = new Request("https://baseerno.ir/api", {
      method: "POST",
      headers: { referer: "https://evil.com/page" },
    });
    expect(isSameOriginRequest(req)).toBe(false);
  });

  it("rejects when no Origin or Referer in production", () => {
    env.NODE_ENV = "production";
    const req = new Request("https://baseerno.ir/api", { method: "POST" });
    expect(isSameOriginRequest(req)).toBe(false);
  });

  it("rejects malformed Origin URL", () => {
    env.NODE_ENV = "production";
    const req = new Request("https://baseerno.ir/api", {
      method: "POST",
      headers: { origin: "not-a-url" },
    });
    expect(isSameOriginRequest(req)).toBe(false);
  });
});

describe("csrfRejectedResponse", () => {
  it("returns a 403 JSON response", () => {
    const res = csrfRejectedResponse();
    expect(res.status).toBe(403);
  });

  it("uses the default Persian message", async () => {
    const res = csrfRejectedResponse();
    const body = await res.json();
    expect(body.error).toContain("نامعتبر");
  });

  it("accepts a custom message", async () => {
    const res = csrfRejectedResponse("custom");
    const body = await res.json();
    expect(body.error).toBe("custom");
  });
});
