import { describe, it, expect, vi, afterEach } from "vitest";
import { log, sanitize, setRequestId, getRequestId } from "../log";

describe("log redaction", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setRequestId(undefined);
  });

  it("redacts sensitive keys before serializing", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    log.info("test", { password: "secret123", token: "abc", ok: true });
    const line = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(line.password).toBe("[REDACTED]");
    expect(line.token).toBe("[REDACTED]");
    expect(line.ok).toBe(true);
    expect(JSON.stringify(line)).not.toContain("secret123");
  });

  it("does not leak emails by default", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    log.error("boom", { email: "a@b.com" });
    const line = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(line.email).toBe("[REDACTED]");
  });

  it("carries the requestId through the module", () => {
    setRequestId("req-123");
    expect(getRequestId()).toBe("req-123");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    log.info("x", {});
    const line = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(line.requestId).toBe("req-123");
  });

  it("sanitize strips sensitive fields from plain objects", () => {
    const out = sanitize({ passwordHash: "h", name: "علی", sig: "s" });
    expect(out.passwordHash).toBe("[REDACTED]");
    expect(out.sig).toBe("[REDACTED]");
    expect(out.name).toBe("علی");
  });
});
