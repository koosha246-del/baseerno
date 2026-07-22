import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendEmail } from "../email";

describe("sendEmail", () => {
  const originalKey = process.env.RESEND_API_KEY;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalKey;
    }
    vi.restoreAllMocks();
  });

  it("falls back to console.log when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const ok = await sendEmail({ to: "a@b.com", subject: "hi", html: "<p>x</p>" });
    expect(ok).toBe(true);
    expect(logSpy).toHaveBeenCalled();
    const call = logSpy.mock.calls[0][0] as string;
    expect(call).toContain("a@b.com");
    expect(call).toContain("hi");
  });

  it("returns the same boolean regardless of body content", async () => {
    delete process.env.RESEND_API_KEY;
    const ok1 = await sendEmail({ to: "a@b.com", subject: "s1", html: "<p>1</p>" });
    const ok2 = await sendEmail({ to: "c@d.com", subject: "s2", html: "<p>2</p>" });
    expect(ok1).toBe(true);
    expect(ok2).toBe(true);
  });
});
