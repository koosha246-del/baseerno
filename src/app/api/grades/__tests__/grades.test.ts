import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks ────────────────────────────────────────────────
const checkRateLimit = vi.fn();
const getClientIdentifier = vi.fn(() => "client-1");
const isSameOriginRequest = vi.fn((_req?: Request) => true);
const getCurrentUser = vi.fn();

const findCourseById = vi.fn();
const listEnrollmentsForCourse = vi.fn();
const createGrade = vi.fn();
const publish = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (id: string, config?: unknown) => checkRateLimit(id, config),
  getClientIdentifier: () => getClientIdentifier(),
  RATE_LIMIT_PRESETS: {
    API: { windowMs: 60_000, max: 20, burst: 5, burstWindowMs: 10_000 },
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
vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: () => getCurrentUser(),
}));
vi.mock("@/lib/db/repository", () => ({
  repository: {
    findCourseById: (id: string) => findCourseById(id),
    listEnrollmentsForCourse: (courseId: string) => listEnrollmentsForCourse(courseId),
    createGrade: (input: unknown) => createGrade(input),
  },
}));
vi.mock("@/lib/events", () => ({
  publish: (event: unknown) => publish(event),
}));

import { POST } from "../../grades/route";

function makeReq(body: unknown, origin = "https://baseerno.ir") {
  return new Request("https://baseerno.ir/api/grades", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}

const valid = { userId: "s-1", courseId: "c-1", score: 18 };

describe("POST /api/grades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSameOriginRequest.mockReturnValue(true);
    checkRateLimit.mockReturnValue({ success: true, remaining: 4, resetAt: Date.now() + 60_000 });
    getCurrentUser.mockResolvedValue({ id: "t-1", role: "TEACHER" });
    findCourseById.mockResolvedValue({ id: "c-1", title: "دوره", mentorId: "t-1" });
    listEnrollmentsForCourse.mockResolvedValue([{ id: "enr-1", userId: "s-1" }]);
    createGrade.mockResolvedValue({ id: "g-1", userId: "s-1", courseId: "c-1", score: 18 });
    publish.mockResolvedValue(undefined);
  });

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

  it("returns 403 for non-teacher users", async () => {
    getCurrentUser.mockResolvedValue({ id: "s-user", role: "STUDENT" });
    const res = await POST(makeReq(valid));
    expect(res.status).toBe(403);
  });

  it("returns 400 on a non-JSON body", async () => {
    const req = new Request("https://baseerno.ir/api/grades", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://baseerno.ir" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 422 when the schema is invalid", async () => {
    const res = await POST(makeReq({ userId: "s-1", courseId: "c-1", score: 25 }));
    expect(res.status).toBe(422);
    expect(createGrade).not.toHaveBeenCalled();
  });

  it("returns 403 when the teacher does not own the course", async () => {
    findCourseById.mockResolvedValue({ id: "c-1", title: "دوره", mentorId: "other" });
    const res = await POST(makeReq(valid));
    expect(res.status).toBe(403);
  });

  it("returns 201 and creates the grade on success", async () => {
    const res = await POST(makeReq(valid));
    expect(res.status).toBe(201);

    expect(createGrade).toHaveBeenCalledWith(
      expect.objectContaining({ teacherId: "t-1", score: 18 }),
    );
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: "grade:posted", score: 18 }),
    );
  });
});
