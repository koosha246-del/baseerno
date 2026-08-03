import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  subscribeToUser,
  pushToUser,
  encodeSse,
  connectionCount,
  clearRealtimeConnections,
} from "../realtime";

describe("realtime", () => {
  beforeEach(() => clearRealtimeConnections());

  it("pushes an SSE payload to the user's connections", () => {
    const writer = vi.fn();
    subscribeToUser("u1", writer);

    const delivered = pushToUser("u1", { type: "notification", title: "تست", body: "سلام" });
    expect(delivered).toBe(1);
    expect(writer).toHaveBeenCalledWith(
      expect.stringContaining("event: notification"),
    );
    expect(writer).toHaveBeenCalledWith(expect.stringContaining('"title":"تست"'));
  });

  it("delivers to every open connection of the user", () => {
    const w1 = vi.fn();
    const w2 = vi.fn();
    subscribeToUser("u1", w1);
    subscribeToUser("u1", w2);

    const delivered = pushToUser("u1", { type: "message-sent" });
    expect(delivered).toBe(2);
    expect(w1).toHaveBeenCalled();
    expect(w2).toHaveBeenCalled();
  });

  it("unsubscribe removes only that connection", () => {
    const w1 = vi.fn();
    const w2 = vi.fn();
    const off1 = subscribeToUser("u1", w1);
    subscribeToUser("u1", w2);

    off1();
    const delivered = pushToUser("u1", { type: "enrollment" });
    expect(delivered).toBe(1);
    expect(w1).not.toHaveBeenCalled();
    expect(w2).toHaveBeenCalled();
  });

  it("does not deliver to users with no connections", () => {
    const delivered = pushToUser("nobody", { type: "notification", title: "x", body: "y" });
    expect(delivered).toBe(0);
  });

  it("encodeSse formats event + data lines", () => {
    const payload = encodeSse({ type: "grade-posted" });
    expect(payload).toBe("event: grade-posted\ndata: {\"type\":\"grade-posted\"}\n\n");
  });

  it("connectionCount tracks open streams", () => {
    subscribeToUser("u1", vi.fn());
    subscribeToUser("u2", vi.fn());
    subscribeToUser("u1", vi.fn());
    expect(connectionCount()).toBe(3);
  });
});
