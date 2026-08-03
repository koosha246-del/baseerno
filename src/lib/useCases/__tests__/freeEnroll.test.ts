import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks ────────────────────────────────────────────────
const createEnrollment = vi.fn();
const publish = vi.fn();

vi.mock("@/lib/db/repository", () => ({
  repository: {
    createEnrollment: (input: unknown) => createEnrollment(input),
  },
}));
vi.mock("@/lib/events", () => ({
  publish: (event: unknown) => publish(event),
}));

import { freeEnroll } from "../enrollment/freeEnroll";

describe("freeEnroll use case", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createEnrollment.mockResolvedValue({
      id: "enr-1",
      userId: "u-1",
      courseId: "c-1",
      status: "ACTIVE",
    });
  });

  it("creates the enrollment and publishes the enrollment:free event", async () => {
    const result = await freeEnroll({
      userId: "u-1",
      courseId: "c-1",
      courseName: "مبانی فن بیان",
    });

    // Publishes exactly once, with the domain event.
    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith({
      type: "enrollment:free",
      userId: "u-1",
      courseId: "c-1",
      courseName: "مبانی فن بیان",
    });

    expect(createEnrollment).toHaveBeenCalledWith({ userId: "u-1", courseId: "c-1" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.free).toBe(true);
      expect(result.enrollment.id).toBe("enr-1");
      expect(result.enrollment.status).toBe("ACTIVE");
      expect(result.message).toContain("رایگان");
    }
  });

  it("does not publish when the enrollment creation fails", async () => {
    createEnrollment.mockRejectedValueOnce(new Error("DB down"));

    await expect(
      freeEnroll({ userId: "u-1", courseId: "c-1", courseName: "دوره" }),
    ).rejects.toThrow("DB down");
    expect(publish).not.toHaveBeenCalled();
  });
});
