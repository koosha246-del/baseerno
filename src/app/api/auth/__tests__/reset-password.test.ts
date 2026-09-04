import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks ────────────────────────────────────────────────
const checkRateLimit = vi.fn();
const getClientIdentifier = vi.fn(() => "client-1");
const isSameOriginRequest = vi.fn((_req?: Request) => true);

const findValidResetToken = vi.fn();
const markTokenUsedUpdate = vi.fn();
const userPasswordUpdate = vi.fn();
const txCommit = vi.fn();
const hashPassword = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (id: string, config?: unknown) => checkRateLimit(id, config),
  getClientIdentifier: () => getClientIdentifier(),
  RATE_LIMIT_PRESETS: {
    AUTH: { windowMs: 60_000, max: 5, burst: 2, burstWindowMs: 10_000 },
  },
  tooManyRequestsResponse: (retryAfter: number) =>
    new Response(JSON.stringify({ error: "rate", retryAfter }), {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }),
}));
vi.mock("@/lib/csrf", () => ({
  isSameOriginRequest: (req: Request) => isSameOriginRequest(req),
  csrfRejectedResponse: () =>
    new Response(JSON.stringify({ error: "csrf" }), { status: 403 }),
}));
vi.mock("@/lib/db/repository", () => ({
  repository: {
    findValidResetToken: (token: string) => findValidResetToken(token),
  },
}));
vi.mock("@/lib/db/prisma-client", () => ({
  prisma: {
    $transaction: (fn: unknown) => txCommit(fn as (tx: never) => Promise<boolean>),
    passwordReset: {
      updateMany: (args: unknown) => markTokenUsedUpdate(args),
    },
    user: {
      update: (args: unknown) => userPasswordUpdate(args),
    },
  },
}));
vi.mock("@/lib/auth/password", () => ({
  hashPassword: (pw: string) => hashPassword(pw),
}));
vi.mock("@/lib/auth/session", () => ({
  clearSession: vi.fn(async () => {}),
}));

import { POST } from "../reset-password/route";
import { clearSession } from "@/lib/auth/session";
import { hashResetToken } from "@/lib/db/domains/users.repo";

function makeReq(body: unknown, origin = "https://baseerno.ir") {
  return new Request("https://baseerno.ir/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSameOriginRequest.mockReturnValue(true);
    checkRateLimit.mockReturnValue({ success: true, remaining: 4, resetAt: Date.now() + 60_000 });
    findValidResetToken.mockResolvedValue({ userId: "u-1", token: "tok" });
    hashPassword.mockResolvedValue("new-hash");
    // Interactive transaction: run the callback with a fake tx client.
    txCommit.mockImplementation(async (fn: (tx: unknown) => Promise<boolean>) =>
      fn({
        passwordReset: { updateMany: markTokenUsedUpdate },
        user: { update: userPasswordUpdate },
      }),
    );
    markTokenUsedUpdate.mockResolvedValue({ count: 1 });
  });

  const valid = { token: "tok", newPassword: "newpass123" };

  it("returns 403 on cross-origin requests", async () => {
    isSameOriginRequest.mockReturnValue(false);
    const res = await POST(makeReq(valid));
    expect(res.status).toBe(403);
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimit.mockReturnValue({ success: false, retryAfter: 30 });
    const res = await POST(makeReq(valid));
    expect(res.status).toBe(429);
  });

  it("returns 400 on a non-JSON body", async () => {
    const req = new Request("https://baseerno.ir/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://baseerno.ir" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 422 when the new password is too short or the token is missing", async () => {
    const short = await POST(makeReq({ token: "tok", newPassword: "123" }));
    expect(short.status).toBe(422);

    const noToken = await POST(makeReq({ token: "", newPassword: "newpass123" }));
    expect(noToken.status).toBe(422);
  });

  it("returns 400 when the reset token is invalid or expired", async () => {
    findValidResetToken.mockResolvedValue(null);
    const res = await POST(makeReq(valid));
    expect(res.status).toBe(400);
    expect(txCommit).not.toHaveBeenCalled();
  });

  it("hashes the password and atomically claims token + updates it", async () => {
    const res = await POST(makeReq(valid));
    expect(res.status).toBe(200);

    expect(hashPassword).toHaveBeenCalledWith("newpass123");
    expect(txCommit).toHaveBeenCalledTimes(1);
    // Conditional claim — only an unused, unexpired token can be marked
    // used. The DB stores only the SHA-256 digest, so the claim must key
    // on the hash.
    expect(markTokenUsedUpdate).toHaveBeenCalledWith({
      where: { token: hashResetToken("tok"), used: false, expiresAt: { gt: expect.any(Date) } },
      data: { used: true },
    });
    // Every other outstanding token for the user is burned in the same tx.
    expect(markTokenUsedUpdate).toHaveBeenCalledWith({
      where: { userId: "u-1", used: false },
      data: { used: true },
    });
    // Session revocation rides along in the same tx.
    expect(userPasswordUpdate).toHaveBeenCalledWith({
      where: { id: "u-1" },
      data: { passwordHash: "new-hash", tokenVersion: { increment: 1 } },
    });
    expect(clearSession).toHaveBeenCalled();
  });

  it("returns 400 when the token was already claimed by a concurrent request", async () => {
    markTokenUsedUpdate.mockResolvedValue({ count: 0 });
    const res = await POST(makeReq(valid));
    expect(res.status).toBe(400);
    expect(userPasswordUpdate).not.toHaveBeenCalled();
    expect(clearSession).not.toHaveBeenCalled();
  });
});
