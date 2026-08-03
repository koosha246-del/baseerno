import { describe, it, expect, vi, beforeEach } from "vitest";

const getCurrentUser = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: () => getCurrentUser(),
}));

import { GET } from "../me/route";

function mockRequest(): Request {
  return new Request("http://localhost:3000/api/auth/me", {
    headers: { "x-forwarded-for": "127.0.0.1" },
  });
}

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await GET(mockRequest());
    expect(res.status).toBe(401);
  });

  it("returns the user when authenticated", async () => {
    const user = { id: "u-1", email: "a@b.com", role: "STUDENT", name: "Ali" };
    getCurrentUser.mockResolvedValue(user);
    const res = await GET(mockRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toEqual(user);
    // Ensure password hash is never exposed
    expect(body.user).not.toHaveProperty("passwordHash");
  });

  it("returns user with all expected SafeUser fields", async () => {
    const user = {
      id: "u-1",
      name: "Ali Reza",
      email: "ali@test.com",
      role: "TEACHER",
      avatar: "https://example.com/avatar.jpg",
      phone: "09121234567",
      bio: "مدرس زبان",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-06-01T00:00:00.000Z",
    };
    getCurrentUser.mockResolvedValue(user);
    const res = await GET(mockRequest());
    const body = await res.json();
    expect(body.user).toEqual(user);
  });

  it("handles ADMIN role correctly", async () => {
    const user = { id: "u-admin", email: "admin@test.com", role: "ADMIN", name: "Admin" };
    getCurrentUser.mockResolvedValue(user);
    const res = await GET(mockRequest());
    const body = await res.json();
    expect(body.user.role).toBe("ADMIN");
  });
});
