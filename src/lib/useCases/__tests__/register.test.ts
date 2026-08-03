import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks ────────────────────────────────────────────────
const findUserByEmail = vi.fn();
const createUser = vi.fn();
const hashPassword = vi.fn();
const setSession = vi.fn();
const publish = vi.fn();

vi.mock("@/lib/db/repository", () => ({
  repository: {
    findUserByEmail: (email: string) => findUserByEmail(email),
    createUser: (input: unknown) => createUser(input),
  },
}));
vi.mock("@/lib/auth/password", () => ({
  hashPassword: (pw: string) => hashPassword(pw),
}));
vi.mock("@/lib/auth/session", () => ({
  setSession: (user: unknown) => setSession(user),
}));
vi.mock("@/lib/events", () => ({
  publish: (event: unknown) => publish(event),
}));

import { registerUser, registerSchema } from "../auth/register";

const validInput = { name: "علی رضایی", email: "ali@example.com", password: "secret123" };

describe("registerUser use case", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hashPassword.mockResolvedValue("hashed-pass");
    createUser.mockResolvedValue({
      id: "u-1",
      name: "علی رضایی",
      email: "ali@example.com",
      role: "STUDENT",
    });
  });

  it("returns 409 when the email is already registered", async () => {
    findUserByEmail.mockResolvedValue({ id: "existing" });

    const result = await registerUser(validInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
      expect(result.error).toContain("قبلاً ثبت");
    }
    expect(createUser).not.toHaveBeenCalled();
    expect(setSession).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it("hashes password, creates user, sets session, publishes event on success", async () => {
    findUserByEmail.mockResolvedValue(null);

    const result = await registerUser(validInput);

    expect(hashPassword).toHaveBeenCalledWith("secret123");
    expect(createUser).toHaveBeenCalledWith({
      name: "علی رضایی",
      email: "ali@example.com",
      passwordHash: "hashed-pass",
      role: "STUDENT",
    });
    expect(setSession).toHaveBeenCalledOnce();
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: "user:registered", email: "ali@example.com" }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.email).toBe("ali@example.com");
      expect(result.user.role).toBe("STUDENT");
    }
  });

  it("zod schema rejects invalid input", () => {
    const bad = registerSchema.safeParse({ name: "Al", email: "not-an-email", password: "123" });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const messages = bad.error.issues.map((i) => i.message).join(" ");
      expect(messages).toContain("۳ حرف");
      expect(messages).toContain("ایمیل");
      expect(messages).toContain("۶ کاراکتر");
    }
  });

  it("zod schema accepts valid input and applies the STUDENT default role", () => {
    const good = registerSchema.safeParse(validInput);
    expect(good.success).toBe(true);
    if (good.success) {
      expect(good.data.role).toBe("STUDENT");
    }
  });
});
