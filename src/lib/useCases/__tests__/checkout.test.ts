import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks ────────────────────────────────────────────────
const findCourseById = vi.fn();
const findEnrollment = vi.fn();
const createPayment = vi.fn();
const setPaymentAuthority = vi.fn();
const markPaymentFailed = vi.fn();
const buildCallbackUrl = vi.fn();
const isZarinpalEnabled = vi.fn();
const zarinpalRequestPayment = vi.fn();
const zarinpalStartPayUrl = vi.fn();
const publish = vi.fn();
const incr = vi.fn();
const freeEnroll = vi.fn();

vi.mock("@/lib/db/repository", () => ({
  repository: {
    findCourseById: (id: string) => findCourseById(id),
    findEnrollment: (userId: string, courseId: string) => findEnrollment(userId, courseId),
    createPayment: (input: unknown) => createPayment(input),
    setPaymentAuthority: (id: string, a: string) => setPaymentAuthority(id, a),
    markPaymentFailed: (id: string) => markPaymentFailed(id),
  },
}));
vi.mock("@/lib/payment-signature", () => ({
  buildCallbackUrl: (paymentId: string) => buildCallbackUrl(paymentId),
}));
vi.mock("@/lib/payment/zarinpal", () => ({
  isZarinpalEnabled: () => isZarinpalEnabled(),
  zarinpalRequestPayment: (input: unknown) => zarinpalRequestPayment(input),
  zarinpalStartPayUrl: (authority: string) => zarinpalStartPayUrl(authority),
}));
vi.mock("@/lib/events", () => ({
  publish: (event: unknown) => publish(event),
}));
vi.mock("@/lib/metrics", () => ({
  incr: (name: string) => incr(name),
}));
vi.mock("@/lib/useCases/enrollment/freeEnroll", () => ({
  freeEnroll: (input: unknown) => freeEnroll(input),
}));

import { checkout, checkoutSchema, buildUseCaseResponse } from "../enrollment/checkout";

const paidCourse = { id: "c-1", title: "دوره پیشرفته", price: 250000, mentorId: "m-1" };
const ctx = { userId: "u-1", userEmail: "ali@example.com" };
const baseInput = { courseId: "c-1", studentName: "علی رضایی", studentEmail: "ali@example.com", paymentMethod: "zarinpal" as const };

describe("checkout use case", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findCourseById.mockResolvedValue(paidCourse);
    findEnrollment.mockResolvedValue(null);
    createPayment.mockResolvedValue({ id: "pay-1", status: "PENDING", amount: 250000 });
    buildCallbackUrl.mockReturnValue("/api/checkout/callback?sign=abc");
    isZarinpalEnabled.mockReturnValue(false);
    incr.mockReturnValue(undefined);
    setPaymentAuthority.mockResolvedValue(undefined);
    markPaymentFailed.mockResolvedValue(undefined);
    freeEnroll.mockResolvedValue({ ok: true, free: true, enrollment: { id: "enr-1" }, message: "ثبت‌نام رایگان" });
    publish.mockResolvedValue(undefined);
  });

  it("returns 404 when the course does not exist", async () => {
    findCourseById.mockResolvedValue(null);
    const result = await checkout({ ...baseInput, ...ctx });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
    expect(createPayment).not.toHaveBeenCalled();
  });

  it("returns 409 when the user is already enrolled", async () => {
    findEnrollment.mockResolvedValue({ id: "enr-existing" });
    const result = await checkout({ ...baseInput, ...ctx });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });

  it("delegates free courses to the freeEnroll use case", async () => {
    findCourseById.mockResolvedValue({ ...paidCourse, price: 0 });
    const result = await checkout({ ...baseInput, ...ctx });

    expect(freeEnroll).toHaveBeenCalledWith({
      userId: "u-1",
      courseId: "c-1",
      courseName: "دوره پیشرفته",
    });
    expect(result.ok).toBe(true);
    if (result.ok && "free" in result) expect(result.free).toBe(true);
  });

  it("creates a PENDING payment and falls back to the simulated gateway when Zarinpal is disabled", async () => {
    const result = await checkout({ ...baseInput, ...ctx });

    expect(createPayment).toHaveBeenCalledWith({
      userId: "u-1",
      courseId: "c-1",
      amount: 250000,
      status: "PENDING",
      method: "زرین‌پال",
    });
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: "payment:created", amount: 250000 }),
    );
    expect(buildCallbackUrl).toHaveBeenCalledWith("pay-1");

    expect(result.ok).toBe(true);
    if (result.ok && "simulated" in result) {
      expect(result.simulated).toBe(true);
      expect(result.redirectUrl).toBe("/api/checkout/callback?sign=abc");
    }
  });

  it("uses the live Zarinpal gateway when enabled", async () => {
    isZarinpalEnabled.mockReturnValue(true);
    zarinpalRequestPayment.mockResolvedValue({ authority: "AUTH-123" });
    zarinpalStartPayUrl.mockReturnValue("https://www.zarinpal.com/pg/StartPay/AUTH-123");

    const result = await checkout({ ...baseInput, ...ctx });

    expect(zarinpalRequestPayment).toHaveBeenCalledWith(
      expect.objectContaining({ amountToman: 250000, orderId: "pay-1" }),
    );
    expect(setPaymentAuthority).toHaveBeenCalledWith("pay-1", "AUTH-123");

    expect(result.ok).toBe(true);
    if (result.ok && "gateway" in result) {
      expect(result.gateway).toBe("zarinpal");
      expect(result.redirectUrl).toBe("https://www.zarinpal.com/pg/StartPay/AUTH-123");
    }
  });

  it("marks the payment failed and returns 502 when Zarinpal errors", async () => {
    isZarinpalEnabled.mockReturnValue(true);
    zarinpalRequestPayment.mockRejectedValue(new Error("timeout"));

    const result = await checkout({ ...baseInput, ...ctx });

    expect(markPaymentFailed).toHaveBeenCalledWith("pay-1");
    expect(incr).toHaveBeenCalledWith("payment:failed");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(502);
  });
});

describe("checkoutSchema", () => {
  it("rejects invalid input", () => {
    expect(checkoutSchema.safeParse({ courseId: "", studentName: "ab", studentEmail: "x" }).success).toBe(false);
  });

  it("accepts valid input and defaults the payment method to zarinpal", () => {
    const parsed = checkoutSchema.safeParse(baseInput);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.paymentMethod).toBe("zarinpal");
  });
});

describe("buildUseCaseResponse (checkout)", () => {
  it("returns the error status on failure", () => {
    const res = buildUseCaseResponse({ ok: false, error: "nope", status: 409 });
    expect(res.status).toBe(409);
  });

  it("returns 200 for a paid checkout with redirect", () => {
    const res = buildUseCaseResponse({ ok: true, payment: {}, redirectUrl: "/cb", message: "ok" });
    expect(res.status).toBe(200);
  });
});
