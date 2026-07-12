import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "../jwt";

describe("JWT", () => {
  it("signs and verifies a token", () => {
    const payload = { sub: "u_1", role: "STUDENT", email: "test@test.com" };
    const token = signToken(payload);

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.sub).toBe("u_1");
    expect(decoded!.role).toBe("STUDENT");
    expect(decoded!.email).toBe("test@test.com");
  });

  it("returns null for invalid token", () => {
    expect(verifyToken("invalid.token.here")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(verifyToken("")).toBeNull();
  });
});
