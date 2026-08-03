import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../password";

describe("password", () => {
  describe("hashPassword", () => {
    it("returns a hash string", async () => {
      const hash = await hashPassword("my-secret-password");
      expect(typeof hash).toBe("string");
      // bcrypt hashes start with $2b$ or $2a$
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it("produces different hashes for the same password (salt)", async () => {
      const hash1 = await hashPassword("same-password");
      const hash2 = await hashPassword("same-password");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("returns true for correct password", async () => {
      const hash = await hashPassword("correct-password");
      const result = await verifyPassword("correct-password", hash);
      expect(result).toBe(true);
    });

    it("returns false for wrong password", async () => {
      const hash = await hashPassword("real-password");
      const result = await verifyPassword("wrong-password", hash);
      expect(result).toBe(false);
    });

    it("returns false for empty string against a real hash", async () => {
      const hash = await hashPassword("something");
      const result = await verifyPassword("", hash);
      expect(result).toBe(false);
    });

    it("returns false when hash is invalid", async () => {
      const result = await verifyPassword("any", "not-a-valid-hash");
      expect(result).toBe(false);
    });
  });
});
