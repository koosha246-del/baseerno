import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock env to control JWT secret ──────────────────────────────────
vi.mock("@/lib/env", () => ({
  env: {
    jwtSecret: "test-secret-that-is-at-least-32-characters-long!!",
    isProduction: false,
    isDevelopment: false,
    isTest: true,
  },
}));

import { signToken, verifyToken, AUTH_COOKIE } from "../jwt";

describe("jwt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AUTH_COOKIE", () => {
    it("has the expected cookie name", () => {
      expect(AUTH_COOKIE).toBe("bn_session");
    });
  });

  describe("signToken", () => {
    it("returns a JWT string with three parts", () => {
      const token = signToken({ sub: "u-1", role: "STUDENT", email: "a@b.com" });
      expect(typeof token).toBe("string");
      const parts = token.split(".");
      expect(parts).toHaveLength(3);
    });

    it("encodes the payload in the token", () => {
      const token = signToken({ sub: "u-1", role: "ADMIN", email: "admin@test.com" });
      const payload = JSON.parse(atob(token.split(".")[1]!));
      expect(payload.sub).toBe("u-1");
      expect(payload.role).toBe("ADMIN");
      expect(payload.email).toBe("admin@test.com");
    });
  });

  describe("verifyToken", () => {
    it("returns the decoded payload for a valid token", () => {
      const token = signToken({ sub: "u-2", role: "TEACHER", email: "teacher@test.com" });
      const decoded = verifyToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded!.sub).toBe("u-2");
      expect(decoded!.role).toBe("TEACHER");
      expect(decoded!.email).toBe("teacher@test.com");
    });

    it("returns null for a tampered token", () => {
      const token = signToken({ sub: "u-1", role: "STUDENT", email: "a@b.com" });
      const tampered = token.slice(0, -5) + "XXXXX";
      const decoded = verifyToken(tampered);
      expect(decoded).toBeNull();
    });

    it("returns null for a completely invalid token", () => {
      const decoded = verifyToken("not-a-jwt-token");
      expect(decoded).toBeNull();
    });

    it("returns null for an empty string", () => {
      const decoded = verifyToken("");
      expect(decoded).toBeNull();
    });

    it("preserves all custom fields in the decoded payload", () => {
      const token = signToken({
        sub: "u-42",
        role: "STUDENT",
        email: "student@test.com",
      });
      const decoded = verifyToken(token);
      expect(decoded).toMatchObject({
        sub: "u-42",
        role: "STUDENT",
        email: "student@test.com",
      });
      expect(decoded!.iat).toBeDefined();
      expect(decoded!.exp).toBeDefined();
    });
  });
});
