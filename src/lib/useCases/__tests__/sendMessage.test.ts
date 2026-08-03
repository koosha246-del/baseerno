import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks ────────────────────────────────────────────────
const findConversationById = vi.fn();
const findCourseById = vi.fn();
const listChatMessages = vi.fn();
const createChatMessage = vi.fn();
const deleteChatMessage = vi.fn();
const completeChat = vi.fn();

vi.mock("@/lib/db/repository", () => ({
  repository: {
    findConversationById: (id: string) => findConversationById(id),
    findCourseById: (id: string) => findCourseById(id),
    listChatMessages: (id: string, opts?: unknown) => listChatMessages(id, opts),
    createChatMessage: (input: unknown) => createChatMessage(input),
    deleteChatMessage: (id: string) => deleteChatMessage(id),
  },
}));
vi.mock("@/lib/ai/llm", () => ({
  completeChat: (turns: unknown) => completeChat(turns),
  LlmError: class LlmError extends Error {},
}));

import { sendMessage, sendMessageSchema } from "../ai/sendMessage";

const conv = {
  id: "conv-1",
  userId: "u-1",
  courseId: "c-1",
  title: "گفتگو با دستیار",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const course = {
  id: "c-1",
  title: "مبانی فن بیان",
  subtitle: "از صفر تا تسلط",
  published: true,
};

describe("sendMessage use case", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findConversationById.mockResolvedValue(conv);
    findCourseById.mockResolvedValue(course);
    listChatMessages.mockResolvedValue([]);
    createChatMessage.mockImplementation((input: { role: string; content: string }) =>
      Promise.resolve({
        id: `msg-${input.role}`,
        role: input.role,
        content: input.content,
        createdAt: new Date("2026-01-01T00:00:00Z"),
      }),
    );
    completeChat.mockResolvedValue({ content: "پاسخ تستی دستیار", mocked: true });
  });

  it("returns 404 for conversations the user does not own", async () => {
    findConversationById.mockResolvedValue({ ...conv, userId: "other-user" });

    const result = await sendMessage(
      "conv-1",
      { content: "سلام" },
      { userId: "u-1" },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
      expect(result.error).toBe("گفتگو یافت نشد.");
    }
    expect(createChatMessage).not.toHaveBeenCalled();
  });

  it("returns 404 when the conversation does not exist", async () => {
    findConversationById.mockResolvedValue(null);

    const result = await sendMessage("missing", { content: "سلام" }, { userId: "u-1" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });

  it("persists the user message, calls the LLM with course context, and persists the reply", async () => {
    const result = await sendMessage(
      "conv-1",
      { content: "خلاصه کن", lessonTitle: "مقدمه" },
      { userId: "u-1" },
    );

    // User message persisted
    const userCall = createChatMessage.mock.calls.find(
      (c) => (c[0] as { role: string }).role === "user",
    );
    expect(userCall?.[0]).toMatchObject({
      conversationId: "conv-1",
      role: "user",
      content: "خلاصه کن",
    });

    // LLM called with system context mentioning the course + lesson
    const turns = completeChat.mock.calls[0]?.[0] as Array<{
      role: string;
      content: string;
    }>;
    const system = turns.find((t) => t.role === "system")?.content ?? "";
    expect(system).toContain("مبانی فن بیان");
    expect(system).toContain("مقدمه");
    const lastTurn = turns[turns.length - 1]!;
    expect(lastTurn.content).toBe("خلاصه کن");

    // Assistant message persisted + returned
    const assistantCall = createChatMessage.mock.calls.find(
      (c) => (c[0] as { role: string }).role === "assistant",
    );
    expect(assistantCall?.[0]).toMatchObject({
      conversationId: "conv-1",
      role: "assistant",
      content: "پاسخ تستی دستیار",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mocked).toBe(true);
      expect(result.assistantMessage.content).toBe("پاسخ تستی دستیار");
    }
  });

  it("returns 502 and rolls back the persisted user message when the LLM fails", async () => {
    completeChat.mockRejectedValue(new Error("boom"));

    const result = await sendMessage("conv-1", { content: "سلام" }, { userId: "u-1" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(502);
      expect(result.error).toContain("هوش مصنوعی");
    }
    // The user turn is rolled back so a retry doesn't duplicate it.
    expect(deleteChatMessage).toHaveBeenCalledWith("msg-user");
  });

  it("zod schema rejects empty content", () => {
    expect(sendMessageSchema.safeParse({ content: "" }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ content: "سلام" }).success).toBe(true);
  });
});
