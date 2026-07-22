import { describe, it, expect, vi, beforeEach } from "vitest";

const getCurrentUser = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: () => getCurrentUser(),
}));

import { GET } from "../me/route";

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns the user when authenticated", async () => {
    const user = { id: "u-1", email: "a@b.com", role: "STUDENT", name: "Ali" };
    getCurrentUser.mockResolvedValue(user);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toEqual(user);
  });
});
