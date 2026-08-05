import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks ───────────────────────────────────────────────────
const findSafeUserById = vi.fn();
const createMessage = vi.fn();
const publish = vi.fn();

vi.mock("@/lib/db/repository", () => ({
  repository: {
    findSafeUserById: (id: string) => findSafeUserById(id),
    createMessage: (input: unknown) => createMessage(input),
  },
}));

vi.mock("@/lib/events", () => ({
  publish: (event: unknown) => publish(event),
}));

import { sendMessage, sendMessageSchema } from "../sendMessage";

describe("sendMessage use case", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates the input shape", () => {
    expect(sendMessageSchema.safeParse({ receiverId: "u-2", body: "سلام" }).success).toBe(true);
    expect(sendMessageSchema.safeParse({ receiverId: "", body: "سلام" }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ receiverId: "u-2", body: "" }).success).toBe(false);
  });

  it("returns a 404-style failure when the receiver does not exist", async () => {
    findSafeUserById.mockResolvedValue(null);
    const result = await sendMessage({
      receiverId: "u-missing",
      body: "سلام",
      senderId: "u-1",
      senderName: "Ali",
    });
    expect(result).toEqual({ ok: false, error: "گیرنده یافت نشد.", status: 404 });
    expect(createMessage).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it("creates the message and publishes the message:sent event", async () => {
    findSafeUserById.mockResolvedValue({ id: "u-2", name: "Sara" });
    createMessage.mockResolvedValue({
      id: "m-1",
      senderId: "u-1",
      receiverId: "u-2",
      body: "سلام",
    });

    const result = await sendMessage({
      receiverId: "u-2",
      body: "سلام",
      senderId: "u-1",
      senderName: "Ali",
    });

    expect(createMessage).toHaveBeenCalledWith({
      senderId: "u-1",
      receiverId: "u-2",
      body: "سلام",
    });
    expect(publish).toHaveBeenCalledWith({
      type: "message:sent",
      senderId: "u-1",
      receiverId: "u-2",
      senderName: "Ali",
    });
    expect(result).toEqual({
      ok: true,
      message: { id: "m-1", senderId: "u-1", receiverId: "u-2", body: "سلام" },
    });
  });
});
