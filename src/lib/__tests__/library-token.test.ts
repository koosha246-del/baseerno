import { describe, it, expect } from "vitest";
import { signDownloadToken, verifyDownloadToken } from "../library-token";

describe("signDownloadToken / verifyDownloadToken", () => {
  it("round-trips a payload", () => {
    const token = signDownloadToken({
      bookId: "smart-english-2",
      purchaseId: "p-1",
      amount: 300000,
    });
    const payload = verifyDownloadToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.bookId).toBe("smart-english-2");
    expect(payload?.purchaseId).toBe("p-1");
    expect(payload?.amount).toBe(300000);
  });

  it("returns null for a tampered token", () => {
    const token = signDownloadToken({
      bookId: "b-1",
      purchaseId: "p-1",
      amount: 1000,
    });
    const tampered = token.slice(0, -3) + "AAA";
    expect(verifyDownloadToken(tampered)).toBeNull();
  });

  it("returns null for a random garbage string", () => {
    expect(verifyDownloadToken("not-a-jwt")).toBeNull();
    expect(verifyDownloadToken("")).toBeNull();
  });

  it("produces tokens with three dot-separated segments", () => {
    const token = signDownloadToken({ bookId: "x", purchaseId: "y", amount: 1 });
    expect(token.split(".")).toHaveLength(3);
  });
});
