import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks ────────────────────────────────────────────────
const findCourseById = vi.fn();
const createConversation = vi.fn();

vi.mock("@/lib/db/repository", () => ({
  repository: {
    findCourseById: (id: string) => findCourseById(id),
    createConversation: (input: unknown) => createConversation(input),
  },
}));

import {
  startConversation,
  startConversationSchema,
} from "../ai/startConversation";

describe("startConversation use case", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createConversation.mockResolvedValue({
      id: "conv-1",
      title: "گفتگو با دستیار",
      courseId: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
  });

  it("creates a general conversation without a course", async () => {
    const result = await startConversation({}, { userId: "u-1" });

    expect(createConversation).toHaveBeenCalledWith({
      userId: "u-1",
      courseId: undefined,
      title: "گفتگو با دستیار",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.conversation.id).toBe("conv-1");
    }
  });

  it("creates a course-scoped conversation when the course exists", async () => {
    findCourseById.mockResolvedValue({ id: "c-1", published: true });

    const result = await startConversation(
      { courseId: "c-1", title: "سؤال درباره درس ۲" },
      { userId: "u-1" },
    );

    expect(findCourseById).toHaveBeenCalledWith("c-1");
    expect(createConversation).toHaveBeenCalledWith({
      userId: "u-1",
      courseId: "c-1",
      title: "سؤال درباره درس ۲",
    });
    expect(result.ok).toBe(true);
  });

  it("returns 404 when the course does not exist", async () => {
    findCourseById.mockResolvedValue(null);

    const result = await startConversation({ courseId: "missing" }, { userId: "u-1" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
      expect(result.error).toBe("دوره یافت نشد.");
    }
    expect(createConversation).not.toHaveBeenCalled();
  });

  it("zod schema accepts empty body and optional fields", () => {
    expect(startConversationSchema.safeParse({}).success).toBe(true);
    expect(
      startConversationSchema.safeParse({ courseId: "c-1", title: "x" }).success,
    ).toBe(true);
    expect(startConversationSchema.safeParse({ courseId: "" }).success).toBe(false);
  });
});
