import { describe, it, expect, vi, beforeEach } from "vitest";

const findUserByEmail = vi.fn();
const createUser = vi.fn();
const hashPassword = vi.fn();
const setSession = vi.fn();
const checkRateLimit = vi.fn();
const getClientIdentifier = vi.fn(() => "client-1");
const isSameOriginRequest = vi.fn((_req?: Request) => true);
const sendEmail = vi.fn().mockResolvedValue(true);

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
vi.mock("@/lib/email", () => ({
  sendEmail: (opts: unknown) => sendEmail(opts),
}));
vi.mock("@/lib/csrf", () => ({
  isSameOriginRequest: (req: Request) => isSameOriginRequest(req),
  csrfRejectedResponse: () =>
    new Response(JSON.stringify({ error: "csrf" }), { status: 403 }),
}));

import { POST } from "../register/route";

function makeReq(body: unknown) {
  return new Request("https://baseerno.ir/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://baseerno.ir" },
    body: JSON.stringify(body),
  });
}

const validInput = { name: "Ali Reza", email: "ali@example.com", password: "secret1" };

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSameOriginRequest.mockReturnValue(true);
    checkRateLimit.mockReturnValue({
      success: true,
      remaining: 4,
      resetAt: Date.now() + 60_000,
    });
    hashPassword.mockResolvedValue("hashed");
    createUser.mockResolvedValue({
      id: "u-1",
      name: "Ali Reza",
      email: "ali@example.com",
      role: "STUDENT",
    });
  });

  it("returns 403 on cross-origin requests", async () => {
    isSameOriginRequest.mockReturnValue(false);
    const res = await POST(makeReq(validInput));
    expect(res.status).toBe(403);
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimit.mockReturnValue({ success: false, retryAfter: 60 });
    const res = await POST(makeReq(validInput));
    expect(res.status).toBe(429);
  });

  it("returns 422 when name is too short", async () => {
    const res = await POST(makeReq({ ...validInput, name: "Al" }));
    expect(res.status).toBe(422);
  });

  it("returns 422 when password is too short", async () => {
    const res = await POST(makeReq({ ...validInput, password: "123" }));
    expect(res.status).toBe(422);
  });

  it("returns 409 when email is taken", async () => {
    findUserByEmail.mockResolvedValue({ id: "existing" });
    const res = await POST(makeReq(validInput));
    expect(res.status).toBe(409);
  });

  it("hashes password, creates user, sets session, returns 201", async () => {
    findUserByEmail.mockResolvedValue(null);
    const res = await POST(makeReq(validInput));
    expect(res.status).toBe(200);
    expect(hashPassword).toHaveBeenCalledWith("secret1");
    expect(createUser).toHaveBeenCalledOnce();
    expect(setSession).toHaveBeenCalledOnce();
  });
});
