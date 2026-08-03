import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────
const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: () => mockCookieStore,
}));

const signToken = vi.fn();
const verifyToken = vi.fn();

vi.mock("@/lib/auth/jwt", () => ({
  signToken: (payload: unknown) => signToken(payload),
  verifyToken: (token: string) => verifyToken(token),
  AUTH_COOKIE: "bn_session",
}));

const findSafeUserById = vi.fn();

vi.mock("@/lib/db/repository", () => ({
  repository: {
    findSafeUserById: (id: string) => findSafeUserById(id),
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    isProduction: false,
    isDevelopment: true,
    isTest: true,
  },
}));

import { setSession, clearSession, getAuthToken, getCurrentUser } from "../session";

const testUser = {
  id: "u-1",
  role: "STUDENT" as const,
  email: "student@test.com",
};

describe("session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("setSession", () => {
    it("sets the session cookie with correct options", async () => {
      signToken.mockReturnValue("signed-token-value");

      await setSession(testUser);

      expect(signToken).toHaveBeenCalledWith({
        sub: testUser.id,
        role: testUser.role,
        email: testUser.email,
      });
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "bn_session",
        "signed-token-value",
        expect.objectContaining({
          httpOnly: true,
          secure: false, // not production
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        }),
      );
    });
  });

  describe("clearSession", () => {
    it("deletes the session cookie", async () => {
      await clearSession();
      expect(mockCookieStore.delete).toHaveBeenCalledWith("bn_session");
    });
  });

  describe("getAuthToken", () => {
    it("returns null when no cookie exists", async () => {
      mockCookieStore.get.mockReturnValue(undefined);
      const result = await getAuthToken();
      expect(result).toBeNull();
    });

    it("returns decoded payload when cookie exists", async () => {
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      verifyToken.mockReturnValue({ sub: "u-1", role: "STUDENT", email: "a@b.com" });

      const result = await getAuthToken();
      expect(result).toEqual({ sub: "u-1", role: "STUDENT", email: "a@b.com" });
      expect(verifyToken).toHaveBeenCalledWith("valid-token");
    });

    it("returns null when token verification fails", async () => {
      mockCookieStore.get.mockReturnValue({ value: "invalid-token" });
      verifyToken.mockReturnValue(null);

      const result = await getAuthToken();
      expect(result).toBeNull();
    });
  });

  describe("getCurrentUser", () => {
    it("returns null when no auth token", async () => {
      mockCookieStore.get.mockReturnValue(undefined);
      const result = await getCurrentUser();
      expect(result).toBeNull();
    });

    it("returns user when token valid and user exists", async () => {
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      verifyToken.mockReturnValue({ sub: "u-1", role: "STUDENT", email: "a@b.com" });
      findSafeUserById.mockResolvedValue({
        id: "u-1",
        name: "Ali",
        email: "a@b.com",
        role: "STUDENT",
        avatar: null,
        phone: null,
        bio: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      });

      const result = await getCurrentUser();
      expect(result).not.toBeNull();
      expect(result!.id).toBe("u-1");
      expect(result!.email).toBe("a@b.com");
    });

    it("returns null when token valid but user not found in DB", async () => {
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      verifyToken.mockReturnValue({ sub: "u-deleted", role: "STUDENT", email: "a@b.com" });
      findSafeUserById.mockResolvedValue(null);

      const result = await getCurrentUser();
      expect(result).toBeNull();
    });
  });
});
