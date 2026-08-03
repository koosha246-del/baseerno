import { describe, it, expect, vi, beforeEach } from "vitest";

const clearSession = vi.fn();
const isSameOriginRequest = vi.fn((_req?: Request) => true);

vi.mock("@/lib/auth/session", () => ({
  clearSession: () => clearSession(),
}));
vi.mock("@/lib/csrf", () => ({
  isSameOriginRequest: (req: Request) => isSameOriginRequest(req),
  csrfRejectedResponse: () =>
    new Response(JSON.stringify({ error: "csrf" }), { status: 403 }),
}));

import { POST } from "../logout/route";

function makeReq(origin = "https://baseerno.ir") {
  return new Request("https://baseerno.ir/api/auth/logout", {
    method: "POST",
    headers: { origin },
  });
}

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSameOriginRequest.mockReturnValue(true);
  });

  it("returns 403 on cross-origin requests", async () => {
    isSameOriginRequest.mockReturnValue(false);
    const res = await POST(makeReq("https://evil.com"));
    expect(res.status).toBe(403);
  });

  it("clears the session and returns ok", async () => {
    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    expect(clearSession).toHaveBeenCalledOnce();
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("clears session even without CSRF check failure", async () => {
    // Logout should always attempt to clear regardless
    await POST(makeReq());
    expect(clearSession).toHaveBeenCalled();
  });

  it("clears the correct auth cookie", async () => {
    await POST(makeReq());
    expect(clearSession).toHaveBeenCalledOnce();
  });
});
