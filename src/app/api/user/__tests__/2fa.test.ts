import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks (must come before importing the route) ───────────────
const getCurrentUser = vi.fn();
const findUserById = vi.fn();
const updateUser = vi.fn();
const generateSecret = vi.fn();
const verifyCode = vi.fn();
const buildOtpauthUri = vi.fn();
const verifyPassword = vi.fn();
const isSameOriginRequest = vi.fn((_req?: Request) => true);
const checkRateLimit = vi.fn();
const getClientIdentifier = vi.fn(() => "client-1");

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: () => getCurrentUser(),
}));

vi.mock("@/lib/db/repository", () => ({
  repository: {
    findUserById: (id: string) => findUserById(id),
    updateUser: (id: string, data: unknown) => updateUser(id, data),
  },
}));

vi.mock("@/lib/security/totp", () => ({
  generateSecret: () => generateSecret(),
  verifyCode: (secret: string, code: string) => verifyCode(secret, code),
  buildOtpauthUri: (secret: string, account: string) => buildOtpauthUri(secret, account),
}));

vi.mock("@/lib/auth/password", () => ({
  verifyPassword: (pw: string, hash: string) => verifyPassword(pw, hash),
}));

vi.mock("@/lib/csrf", () => ({
  isSameOriginRequest: (req: Request) => isSameOriginRequest(req),
  csrfRejectedResponse: () =>
    new Response(JSON.stringify({ error: "csrf" }), { status: 403 }),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (id: string, config?: unknown) => checkRateLimit(id, config),
  getClientIdentifier: () => getClientIdentifier(),
  RATE_LIMIT_PRESETS: {
    AUTH: { windowMs: 60_000, max: 5, burst: 2, burstWindowMs: 10_000 },
    API: { windowMs: 60_000, max: 20, burst: 5, burstWindowMs: 5_000 },
    READ: { windowMs: 60_000, max: 60, burst: 10, burstWindowMs: 2_000 },
    SENSITIVE: { windowMs: 120_000, max: 3, burst: 1, burstWindowMs: 30_000 },
  },
  tooManyRequestsResponse: (retryAfter: number) =>
    new Response(JSON.stringify({ error: "rate", retryAfter }), {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }),
}));

import { GET, POST, DELETE } from "../2fa/route";

function makeReq(method: string, body?: unknown, origin = "https://baseerno.ir") {
  const init: RequestInit = {
    method,
    headers: { "x-forwarded-for": "127.0.0.1" } as Record<string, string>,
  };
  if (body !== undefined) {
    (init.headers as Record<string, string>)["content-type"] = "application/json";
    (init.headers as Record<string, string>).origin = origin;
    init.body = JSON.stringify(body);
  }
  return new Request("https://baseerno.ir/api/user/2fa", init);
}

const user = { id: "u-1", name: "Ali", email: "ali@test.com", role: "TEACHER" as const };

describe("2FA status / enable / disable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSameOriginRequest.mockReturnValue(true);
    checkRateLimit.mockReturnValue({
      success: true,
      remaining: 19,
      resetAt: Date.now() + 60_000,
    });
    getCurrentUser.mockResolvedValue(user);
    findUserById.mockResolvedValue({ id: "u-1", twoFactorEnabled: false, passwordHash: "h" });
    verifyPassword.mockResolvedValue(true);
    verifyCode.mockReturnValue(true);
    // The routes now surface write failures — a successful mock must
    // resolve to a truthy SafeUser-shaped result.
    updateUser.mockResolvedValue({ id: "u-1", twoFactorEnabled: true });
  });

  // ─── GET status ─────────────────────────────────────────────────
  it("GET returns 401 when not authenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await GET(makeReq("GET"));
    expect(res.status).toBe(401);
  });

  it("GET provisions a fresh secret when 2FA is disabled", async () => {
    generateSecret.mockReturnValue("SECRET1234567890123456");
    buildOtpauthUri.mockReturnValue("otpauth://totp/x");
    const res = await GET(makeReq("GET"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.enabled).toBe(false);
    expect(body.secret).toBe("SECRET1234567890123456");
    expect(body.otpauthUri).toBe("otpauth://totp/x");
    expect(buildOtpauthUri).toHaveBeenCalledWith("SECRET1234567890123456", "ali@test.com");
  });

  it("GET does not expose the secret when 2FA is already enabled", async () => {
    findUserById.mockResolvedValue({ id: "u-1", twoFactorEnabled: true });
    const res = await GET(makeReq("GET"));
    const body = await res.json();
    expect(body.enabled).toBe(true);
    expect(body.secret).toBeUndefined();
    expect(generateSecret).not.toHaveBeenCalled();
  });

  // ─── POST enable ────────────────────────────────────────────────
  it("POST returns 403 on cross-origin requests", async () => {
    isSameOriginRequest.mockReturnValue(false);
    const res = await POST(makeReq("POST", { secret: "s".repeat(16), code: "123456" }));
    expect(res.status).toBe(403);
  });

  it("POST returns 401 when not authenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(makeReq("POST", { secret: "s".repeat(16), code: "123456" }));
    expect(res.status).toBe(401);
  });

  it("POST returns 422 when the code is not 6 digits", async () => {
    const res = await POST(makeReq("POST", { secret: "s".repeat(16), code: "123" }));
    expect(res.status).toBe(422);
  });

  it("POST returns 422 when the secret is too short", async () => {
    const res = await POST(makeReq("POST", { secret: "short", code: "123456" }));
    expect(res.status).toBe(422);
  });

  it("POST rejects a wrong verification code", async () => {
    verifyCode.mockReturnValue(false);
    const res = await POST(makeReq("POST", { secret: "s".repeat(16), code: "123456" }));
    expect(res.status).toBe(400);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("POST enables 2FA after code verification", async () => {
    const secret = "ABCDEFGHIJKLMNOP";
    const res = await POST(makeReq("POST", { secret, code: "123456" }));
    expect(res.status).toBe(200);
    expect(updateUser).toHaveBeenCalledWith("u-1", {
      twoFactorSecret: secret,
      twoFactorEnabled: true,
    });
    const body = await res.json();
    expect(body.enabled).toBe(true);
  });

  // ─── DELETE disable ─────────────────────────────────────────────
  it("DELETE returns 403 on cross-origin requests", async () => {
    isSameOriginRequest.mockReturnValue(false);
    const res = await DELETE(makeReq("DELETE", { currentPassword: "pw" }));
    expect(res.status).toBe(403);
  });

  it("DELETE returns 422 when currentPassword is missing", async () => {
    const res = await DELETE(makeReq("DELETE", {}));
    expect(res.status).toBe(422);
  });

  it("DELETE returns 404 when the user is not found", async () => {
    findUserById.mockResolvedValue(null);
    const res = await DELETE(makeReq("DELETE", { currentPassword: "pw" }));
    expect(res.status).toBe(404);
  });

  it("DELETE returns 400 when the current password is wrong", async () => {
    verifyPassword.mockResolvedValue(false);
    const res = await DELETE(makeReq("DELETE", { currentPassword: "wrong" }));
    expect(res.status).toBe(400);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("DELETE disables 2FA after password re-auth", async () => {
    const res = await DELETE(makeReq("DELETE", { currentPassword: "pw" }));
    expect(res.status).toBe(200);
    expect(updateUser).toHaveBeenCalledWith("u-1", {
      twoFactorSecret: null,
      twoFactorEnabled: false,
    });
    const body = await res.json();
    expect(body.enabled).toBe(false);
  });
});
