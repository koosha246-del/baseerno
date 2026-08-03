import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks ───────────────────────────────────────────────────
const getCurrentUser = vi.fn();
const findCourseById = vi.fn();
const findEnrollment = vi.fn();
const createEnrollment = vi.fn();
const createPayment = vi.fn();
const setPaymentAuthority = vi.fn();
const markPaymentFailed = vi.fn();
const notifyEnrollment = vi.fn();
const buildCallbackUrl = vi.fn();
const checkRateLimit = vi.fn();
const getClientIdentifier = vi.fn(() => "client-1");
const isSameOriginRequest = vi.fn((_req?: Request) => true);

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: () => getCurrentUser(),
}));

vi.mock("@/lib/db/repository", () => ({
  repository: {
    findCourseById: (id: string) => findCourseById(id),
    findEnrollment: (uid: string, cid: string) => findEnrollment(uid, cid),
    createEnrollment: (input: unknown) => createEnrollment(input),
    createPayment: (input: unknown) => createPayment(input),
    setPaymentAuthority: (pid: string, auth: string) => setPaymentAuthority(pid, auth),
    markPaymentFailed: (pid: string) => markPaymentFailed(pid),
  },
}));

vi.mock("@/lib/notifications", () => ({
  notifyEnrollment: (uid: string, title: string) => notifyEnrollment(uid, title),
}));

vi.mock("@/lib/payment-signature", () => ({
  buildCallbackUrl: (pid: string) => buildCallbackUrl(pid),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (id: string, config?: unknown) => checkRateLimit(id, config),
  getClientIdentifier: () => getClientIdentifier(),
  RATE_LIMIT_PRESETS: {
    SENSITIVE: { windowMs: 120_000, max: 3, burst: 1, burstWindowMs: 30_000 },
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

vi.mock("@/lib/payment/zarinpal", () => ({
  isZarinpalEnabled: () => false,
}));

vi.mock("@/lib/cache-tags", () => ({
  CACHE_TAGS: { payments: "payments", courses: "courses" },
  enrollmentCacheTags: (uid: string, cid: string) => [
    "enrollments",
    "payments",
    `course:${cid}`,
    `user:${uid}`,
    "courses",
    "admin:reports",
  ],
}));

vi.mock("next/cache", () => ({
  revalidateTag: () => {},
}));

import { POST } from "../route";

function makeReq(body: unknown) {
  return new Request("https://baseerno.ir/api/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://baseerno.ir",
    },
    body: JSON.stringify(body),
  });
}

const authenticatedUser = {
  id: "u-1",
  email: "student@test.com",
  role: "STUDENT" as const,
  name: "Ali",
};

const freeCourse = {
  id: "c-free",
  title: "دوره رایگان",
  price: null,
};

const paidCourse = {
  id: "c-paid",
  title: "دوره حرفه‌ای",
  price: 500000,
};

const validInput = {
  courseId: "c-free",
  studentName: "Ali Reza",
  studentEmail: "ali@test.com",
};

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSameOriginRequest.mockReturnValue(true);
    checkRateLimit.mockReturnValue({
      success: true,
      remaining: 2,
      resetAt: Date.now() + 120_000,
    });
    getCurrentUser.mockResolvedValue(authenticatedUser);
  });

  it("returns 401 when user is not authenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(makeReq(validInput));
    expect(res.status).toBe(401);
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

  it("returns 422 for invalid input (short name)", async () => {
    const res = await POST(makeReq({ ...validInput, studentName: "A" }));
    expect(res.status).toBe(422);
  });

  it("returns 422 for invalid input (missing courseId)", async () => {
    const res = await POST(makeReq({ studentName: "Ali", studentEmail: "a@b.com" }));
    expect(res.status).toBe(422);
  });

  it("returns 404 when course does not exist", async () => {
    findCourseById.mockResolvedValue(null);
    const res = await POST(makeReq(validInput));
    expect(res.status).toBe(404);
  });

  it("returns 409 when user is already enrolled", async () => {
    findCourseById.mockResolvedValue(freeCourse);
    findEnrollment.mockResolvedValue({ id: "e-1" });
    const res = await POST(makeReq(validInput));
    expect(res.status).toBe(409);
  });

  it("creates enrollment directly for free courses", async () => {
    findCourseById.mockResolvedValue(freeCourse);
    findEnrollment.mockResolvedValue(null);
    createEnrollment.mockResolvedValue({ id: "enroll-1" });

    const res = await POST(makeReq(validInput));
    expect(res.status).toBe(200);
    expect(createEnrollment).toHaveBeenCalledWith({
      userId: "u-1",
      courseId: "c-free",
    });
    expect(notifyEnrollment).toHaveBeenCalledWith("u-1", "دوره رایگان");
  });

  it("creates PENDING payment for paid courses in simulated mode", async () => {
    findCourseById.mockResolvedValue(paidCourse);
    findEnrollment.mockResolvedValue(null);
    createPayment.mockResolvedValue({ id: "pay-1", amount: 500000, status: "PENDING" });
    buildCallbackUrl.mockReturnValue("/api/checkout/callback?paymentId=pay-1&sig=abc");

    const res = await POST(makeReq({ ...validInput, courseId: "c-paid" }));
    expect(res.status).toBe(200);
    expect(createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u-1",
        courseId: "c-paid",
        amount: 500000,
        status: "PENDING",
      }),
    );
  });

  it("returns simulated: true for paid courses without Zarinpal", async () => {
    findCourseById.mockResolvedValue(paidCourse);
    findEnrollment.mockResolvedValue(null);
    createPayment.mockResolvedValue({ id: "pay-1", amount: 500000, status: "PENDING" });
    buildCallbackUrl.mockReturnValue("/api/checkout/callback?paymentId=pay-1&sig=abc");

    const res = await POST(makeReq({ ...validInput, courseId: "c-paid" }));
    const body = await res.json();
    expect(body.simulated).toBe(true);
    expect(body.message).toContain("شبیه‌سازی");
  });
});
