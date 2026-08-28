import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks ────────────────────────────────────────────────
const findUserByEmail = vi.fn();
const verifyPassword = vi.fn();
const setSession = vi.fn();
const publish = vi.fn();
const verifyCode = vi.fn();
const incr = vi.fn();
const findDemoAccount = vi.fn();
const demoAccountToSafeUser = vi.fn();
// Mutable env so individual tests can toggle demoMode. vi.hoisted keeps it
// reachable from the (hoisted) vi.mock factories below.
const envMock = vi.hoisted(() => ({ demoMode: false }) as { demoMode: boolean });

vi.mock("@/lib/db/repository", () => ({
  repository: { findUserByEmail: (email: string) => findUserByEmail(email) },
}));
vi.mock("@/lib/auth/password", () => ({
  verifyPassword: (pw: string, hash: string) => verifyPassword(pw, hash),
}));
vi.mock("@/lib/auth/session", () => ({
  setSession: (user: unknown) => setSession(user),
}));
vi.mock("@/lib/events", () => ({
  publish: (event: unknown) => publish(event),
}));
vi.mock("@/lib/security/totp", () => ({
  verifyCode: (secret: string, code: string) => verifyCode(secret, code),
}));
vi.mock("@/lib/metrics", () => ({
  incr: (name: string) => incr(name),
}));
vi.mock("@/lib/env", () => ({
  env: envMock,
}));
vi.mock("@/lib/auth/demo-users", () => ({
  findDemoAccount: (email: string) => findDemoAccount(email),
  demoAccountToSafeUser: (account: unknown) => demoAccountToSafeUser(account),
}));

import { loginUser, loginSchema, buildUseCaseResponse } from "../auth/login";

const dbUser = {
  id: "u-1",
  name: "علی رضایی",
  email: "ali@example.com",
  role: "STUDENT",
  passwordHash: "hashed-pass",
  twoFactorEnabled: false,
  twoFactorSecret: null,
};

describe("loginUser use case", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.demoMode = false;
    findUserByEmail.mockResolvedValue(dbUser);
    verifyPassword.mockResolvedValue(true);
    setSession.mockResolvedValue(undefined);
    publish.mockResolvedValue(undefined);
    incr.mockReturnValue(undefined);
  });

  const validInput = { email: "ali@example.com", password: "secret123" };

  it("returns 401 when the email does not match any user", async () => {
    findUserByEmail.mockResolvedValue(null);
    const result = await loginUser(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok && !("requiresTwoFactor" in result)) {
      expect(result.status).toBe(401);
      expect(result.error).toContain("ایمیل یا رمز عبور");
    }
    expect(incr).toHaveBeenCalledWith("auth:failed");
    expect(setSession).not.toHaveBeenCalled();
  });

  it("returns 401 when the password is wrong", async () => {
    verifyPassword.mockResolvedValue(false);
    const result = await loginUser(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok && !("requiresTwoFactor" in result)) {
      expect(result.status).toBe(401);
    }
    expect(incr).toHaveBeenCalledWith("auth:failed");
    expect(setSession).not.toHaveBeenCalled();
  });

  it("returns 403 requiresTwoFactor when 2FA enabled and no code given", async () => {
    findUserByEmail.mockResolvedValue({ ...dbUser, twoFactorEnabled: true, twoFactorSecret: "SECRET" });
    const result = await loginUser(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok && "requiresTwoFactor" in result) {
      expect(result.requiresTwoFactor).toBe(true);
      expect(result.status).toBe(403);
    }
    expect(setSession).not.toHaveBeenCalled();
  });

  it("returns 401 when the 2FA code is wrong", async () => {
    findUserByEmail.mockResolvedValue({ ...dbUser, twoFactorEnabled: true, twoFactorSecret: "SECRET" });
    verifyCode.mockReturnValue(false);

    const result = await loginUser({ ...validInput, twoFactorCode: "000000" });

    expect(result.ok).toBe(false);
    if (!result.ok && !("requiresTwoFactor" in result)) {
      expect(result.status).toBe(401);
    }
    expect(incr).toHaveBeenCalledWith("auth:failed");
    expect(setSession).not.toHaveBeenCalled();
  });

  it("verifies password, sets session and publishes on success", async () => {
    const result = await loginUser(validInput);

    expect(verifyPassword).toHaveBeenCalledWith("secret123", "hashed-pass");
    expect(setSession).toHaveBeenCalledOnce();
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: "user:login", userId: "u-1" }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Whitelisted fields only — never the password hash / 2FA secret.
      expect(result.user).toEqual({
        id: "u-1",
        name: "علی رضایی",
        email: "ali@example.com",
        role: "STUDENT",
      });
    }
  });

  it("accepts a valid 2FA code when 2FA is enabled", async () => {
    findUserByEmail.mockResolvedValue({ ...dbUser, twoFactorEnabled: true, twoFactorSecret: "SECRET" });
    verifyCode.mockReturnValue(true);

    const result = await loginUser({ ...validInput, twoFactorCode: "123456" });

    expect(verifyCode).toHaveBeenCalledWith("SECRET", "123456");
    expect(result.ok).toBe(true);
  });

  it("falls back to demo account in demoMode when DB is unreachable", async () => {
    const demo = { id: "demo_student", name: "دانشجوی آزمایشی", email: "student@baseerno.ir", role: "STUDENT", password: "123456" };
    findUserByEmail.mockRejectedValue(new Error("DB down"));
    findDemoAccount.mockReturnValue(demo);
    demoAccountToSafeUser.mockReturnValue({ ...demo, createdAt: "", updatedAt: "" });
    envMock.demoMode = true;

    const result = await loginUser({ email: "student@baseerno.ir", password: "123456" });

    expect(setSession).toHaveBeenCalledOnce();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.id).toBe("demo_student");
    }
  });
});

describe("loginSchema validation", () => {
  it("rejects invalid input", () => {
    const bad = loginSchema.safeParse({ email: "not-an-email", password: "" });
    const badTwoFactor = loginSchema.safeParse({ email: "a@b.c", password: "x", twoFactorCode: "12" });
    expect(bad.success).toBe(false);
    expect(badTwoFactor.success).toBe(false);
  });

  it("accepts valid input with an optional 2FA code", () => {
    expect(loginSchema.safeParse({ email: "ali@example.com", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "ali@example.com", password: "x", twoFactorCode: "123456" }).success).toBe(true);
  });
});

describe("buildUseCaseResponse (login)", () => {
  it("returns 200 with the user when ok", () => {
    const res = buildUseCaseResponse({ ok: true, user: { id: "u-1", name: "علی", email: "a@b.c", role: "STUDENT" } });
    expect(res.status).toBe(200);
  });

  it("returns 403 when 2FA is required", () => {
    const res = buildUseCaseResponse({ ok: false, requiresTwoFactor: true, status: 403 });
    expect(res.status).toBe(403);
  });

  it("returns the error status when login fails", () => {
    const res = buildUseCaseResponse({ ok: false, error: "bad", status: 401 });
    expect(res.status).toBe(401);
  });
});
