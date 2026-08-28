import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks ────────────────────────────────────────────────
const findCourseById = vi.fn();
const listEnrollmentsForCourse = vi.fn();
const createGrade = vi.fn();
const publish = vi.fn();

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

import { postGrade, postGradeSchema, buildUseCaseResponse } from "../grades/postGrade";

const teacherCourse = { id: "c-1", title: "دوره پیشرفته", mentorId: "t-1" };
const context = { teacherId: "t-1" };
const baseInput = { userId: "s-1", courseId: "c-1", score: 18 };

describe("postGrade use case", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findCourseById.mockResolvedValue(teacherCourse);
    listEnrollmentsForCourse.mockResolvedValue([{ id: "enr-1", userId: "s-1" }]);
    createGrade.mockResolvedValue({ id: "g-1", userId: "s-1", courseId: "c-1", score: 18 });
    publish.mockResolvedValue(undefined);
  });

  it("returns 403 when the course is missing or the teacher does not own it", async () => {
    findCourseById.mockResolvedValue(null);
    let result = await postGrade({ ...baseInput, ...context });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);

    findCourseById.mockResolvedValue({ ...teacherCourse, mentorId: "other-teacher" });
    result = await postGrade({ ...baseInput, ...context });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
    expect(createGrade).not.toHaveBeenCalled();
  });

  it("returns 404 when the student is not enrolled", async () => {
    listEnrollmentsForCourse.mockResolvedValue([{ id: "enr-x", userId: "someone-else" }]);
    const result = await postGrade({ ...baseInput, ...context });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
    expect(createGrade).not.toHaveBeenCalled();
  });

  it("creates the grade and publishes the grade:posted event on success", async () => {
    const result = await postGrade({ ...baseInput, ...context });

    expect(createGrade).toHaveBeenCalledWith({
      userId: "s-1",
      courseId: "c-1",
      enrollmentId: "enr-1",
      score: 18,
      feedback: undefined,
      teacherId: "t-1",
    });
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: "grade:posted", userId: "s-1", courseId: "c-1", score: 18 }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.grade.id).toBe("g-1");
      expect(result.grade.score).toBe(18);
    }
  });
});

describe("postGradeSchema", () => {
  it("rejects a score out of the 0..20 range and a negative number", () => {
    expect(postGradeSchema.safeParse({ ...baseInput, score: 21 }).success).toBe(false);
    expect(postGradeSchema.safeParse({ ...baseInput, score: -1 }).success).toBe(false);
  });

  it("rejects an empty userId or courseId", () => {
    expect(postGradeSchema.safeParse({ ...baseInput, userId: "" }).success).toBe(false);
    expect(postGradeSchema.safeParse({ ...baseInput, courseId: "" }).success).toBe(false);
  });

  it("accepts a valid grade with optional feedback", () => {
    expect(postGradeSchema.safeParse(baseInput).success).toBe(true);
    expect(postGradeSchema.safeParse({ ...baseInput, score: 0, feedback: "بسیار خوب" }).success).toBe(true);
  });
});

describe("buildUseCaseResponse (post-grade)", () => {
  it("returns 201 with the grade when ok", () => {
    const res = buildUseCaseResponse({ ok: true, grade: { id: "g-1", userId: "s-1", courseId: "c-1", score: 18 } });
    expect(res.status).toBe(201);
  });

  it("returns the error status when posting fails", () => {
    const res = buildUseCaseResponse({ ok: false, error: "no", status: 403 });
    expect(res.status).toBe(403);
  });
});
