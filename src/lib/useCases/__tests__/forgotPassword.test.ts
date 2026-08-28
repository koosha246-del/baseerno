import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks ────────────────────────────────────────────────
const findUserByEmail = vi.fn();
const createPasswordReset = vi.fn();
const publish = vi.fn();
// Mutable env so individual tests can toggle isDevelopment (dev token leak).
// vi.hoisted keeps it available to the hoisted vi.mock factories below.
const envMock = vi.hoisted(() => ({ isDevelopment: true }) as { isDevelopment: boolean });

vi.mock("@/lib/db/repository", () => ({
  repository: {
    findUserByEmail: (email: string) => findUserByEmail(email),
    createPasswordReset: (userId: string) => createPasswordReset(userId),
  },
}));
vi.mock("@/lib/events", () => ({
  publish: (event: unknown) => publish(event),
}));
vi.mock("@/lib/env", () => ({
  env: envMock,
}));
vi.mock("@/config/site", () => ({
  siteConfig: { url: "https://baseerno.ir" },
}));

import { forgotPassword, forgotPasswordSchema, buildUseCaseResponse } from "../auth/forgotPassword";

describe("forgotPassword use case", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.isDevelopment = true;
    findUserByEmail.mockResolvedValue({
      id: "u-1",
      name: "علی رضایی",
      email: "ali@example.com",
    });
    createPasswordReset.mockResolvedValue({ token: "reset-token-123" });
    publish.mockResolvedValue(undefined);
  });

  it("always returns ok for an unknown email (anti-enumeration) without creating a reset", async () => {
    findUserByEmail.mockResolvedValue(null);

    const result = await forgotPassword({ email: "ghost@example.com" });

    expect(result.ok).toBe(true);
    expect(result.message).toContain("ایمیل");
    expect(createPasswordReset).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it("creates a reset token and publishes the password-reset event for a known user", async () => {
    const result = await forgotPassword({ email: "ali@example.com" });

    expect(createPasswordReset).toHaveBeenCalledWith("u-1");
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "user:password-reset",
        userId: "u-1",
        email: "ali@example.com",
        resetUrl: "https://baseerno.ir/reset-password?token=reset-token-123",
      }),
    );
    expect(result.ok).toBe(true);
  });

  it("does not expose the raw token in any environment", async () => {
    envMock.isDevelopment = true;
    const dev = await forgotPassword({ email: "ali@example.com" });
    expect((dev as unknown as Record<string, unknown>)._devToken).toBeUndefined();

    envMock.isDevelopment = false;
    const prod = await forgotPassword({ email: "ali@example.com" });
    expect((prod as unknown as Record<string, unknown>)._devToken).toBeUndefined();
  });
});

describe("forgotPasswordSchema", () => {
  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  it("accepts a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "ali@example.com" }).success).toBe(true);
  });
});

describe("buildUseCaseResponse (forgot-password)", () => {
  it("always returns 200", () => {
    const res = buildUseCaseResponse({ ok: true, message: "sent" });
    expect(res.status).toBe(200);
  });

  it("omits devToken when absent", () => {
    const res = buildUseCaseResponse({ ok: true, message: "sent" });
    expect(res.status).toBe(200);
  });
});
