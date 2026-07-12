import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../password";

describe("password", () => {
  it("hashes password and verifies correctly", async () => {
    const plain = "mypassword123";
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash.length).toBeGreaterThan(20);

    const ok = await verifyPassword(plain, hash);
    expect(ok).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("correct");
    const ok = await verifyPassword("wrong", hash);
    expect(ok).toBe(false);
  });
});
