import { describe, it, expect } from "vitest";
import { signDownloadToken, verifyDownloadToken } from "../library-token";

describe("signDownloadToken / verifyDownloadToken", () => {
  it("round-trips a payload", () => {
    const token = signDownloadToken({
      bookId: "genius-1",
      purchaseId: "p-1",
      amount: 280000,
      userId: "u_student_1",

    });
    const payload = verifyDownloadToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.bookId).toBe("genius-1");
    expect(payload?.purchaseId).toBe("p-1");
    expect(payload?.amount).toBe(280000);
  });

  it("returns null for a tampered token", () => {
    const token = signDownloadToken({
      bookId: "b-1",
      purchaseId: "p-1",
      amount: 1000,
      userId: "u_student_1",

    });
    const tampered = token.slice(0, -3) + "AAA";
    expect(verifyDownloadToken(tampered)).toBeNull();
  });

  it("returns null for a random garbage string", () => {
    expect(verifyDownloadToken("not-a-jwt")).toBeNull();
    expect(verifyDownloadToken("")).toBeNull();
  });

  it("produces tokens with three dot-separated segments", () => {
    const token = signDownloadToken({ bookId: "x", purchaseId: "y", amount: 1, userId: "u_1" });
    expect(token.split(".")).toHaveLength(3);
  });
});
