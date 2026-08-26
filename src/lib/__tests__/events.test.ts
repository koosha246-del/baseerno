import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Module mocks (lazy imports inside subscriptions) ────────────────
const revalidateTag = vi.fn();
const notifyNewMessage = vi.fn();
const pushToUser = vi.fn();
const sendEmail = vi.fn();
const findUserById = vi.fn();
const createAuditLog = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag: (tag: string) => revalidateTag(tag),
}));

vi.mock("@/lib/notifications", () => ({
  notifyEnrollment: vi.fn(),
  notifyPaymentSuccess: vi.fn(),
  notifyGradePosted: vi.fn(),
  notifyNewMessage: (uid: string, name: string) => notifyNewMessage(uid, name),
  notifyCertificateIssued: vi.fn(),
  notifyAdmins: vi.fn(),
}));

vi.mock("@/lib/realtime", () => ({
  pushToUser: (uid: string, event: unknown) => pushToUser(uid, event),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: (input: unknown) => sendEmail(input),
}));

vi.mock("@/lib/db/repository", () => ({
  repository: {
    findUserById: (id: string) => findUserById(id),
    listUsers: vi.fn(),
  },
}));

vi.mock("@/lib/db/domains/audit.repo", () => ({
  createAuditLog: (entry: unknown) => createAuditLog(entry),
}));

vi.mock("@/lib/db/domains/search.repo", () => ({
  syncCourseSearch: vi.fn(),
}));

import { publish, on } from "../events";

describe("event bus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when no handler is registered", async () => {
    await expect(publish({ type: "user:login", userId: "u-1", email: "a@b.com" })).resolves.toBeUndefined();
  });

  it("invokes registered handlers for the event type", async () => {
    const handler = vi.fn(async () => {});
    on("user:login", handler);
    await publish({ type: "user:login", userId: "u-1", email: "a@b.com" });
    expect(handler).toHaveBeenCalledWith({
      type: "user:login",
      userId: "u-1",
      email: "a@b.com",
    });
  });

  it("unsubscribes a handler", async () => {
    const handler = vi.fn(async () => {});
    const off = on("course:updated", handler);
    off();
    await publish({ type: "course:updated", courseId: "c-1" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("isolates handler errors so publish never rejects", async () => {
    const failing = vi.fn(async () => {
      throw new Error("boom");
    });
    const ok = vi.fn(async () => {});
    on("grade:posted", failing);
    on("grade:posted", ok);
    await expect(
      publish({
        type: "grade:posted",
        userId: "u-1",
        courseId: "c-1",
        courseName: "دوره",
        score: 18,
      }),
    ).resolves.toBeUndefined();
    expect(ok).toHaveBeenCalled();
  });

  it("revalidates cache tags and notifies on message:sent", async () => {
    await publish({
      type: "message:sent",
      senderId: "u-1",
      receiverId: "u-2",
      senderName: "Ali",
    });
    expect(revalidateTag).toHaveBeenCalledWith("messages");
    expect(revalidateTag).toHaveBeenCalledWith("notifications");
    expect(revalidateTag).toHaveBeenCalledWith("user:u-2");
    expect(notifyNewMessage).toHaveBeenCalledWith("u-2", "Ali");
    expect(pushToUser).toHaveBeenCalledWith("u-2", { type: "message-sent" });
  });

  it("writes an audit entry on user:login", async () => {
    await publish({ type: "user:login", userId: "u-1", email: "a@b.com" });
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "auth.login", actorId: "u-1" }),
    );
  });
});
