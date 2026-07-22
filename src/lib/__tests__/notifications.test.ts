import { describe, it, expect, vi, beforeEach } from "vitest";

const createNotification = vi.fn();
vi.mock("@/lib/db/repository", () => ({
  repository: {
    createNotification: (input: unknown) => createNotification(input),
  },
}));

// Import after mocking so the module sees the mock
import {
  notifyEnrollment,
  notifyPaymentSuccess,
  notifyGradePosted,
  notifyNewMessage,
  notifyCertificateIssued,
} from "../notifications";

describe("notification helpers", () => {
  beforeEach(() => {
    createNotification.mockReset();
    createNotification.mockResolvedValue({ id: "n-1" });
  });

  it("notifyEnrollment fires a success notification with link", async () => {
    await notifyEnrollment("u-1", "Speaking 101");
    expect(createNotification).toHaveBeenCalledOnce();
    const call = createNotification.mock.calls[0]?.[0] as {
      userId: string;
      type: string;
      title: string;
      body: string;
      link?: string;
    };
    expect(call.userId).toBe("u-1");
    expect(call.type).toBe("success");
    expect(call.title).toContain("ثبت‌نام");
    expect(call.body).toContain("Speaking 101");
    expect(call.link).toBe("/dashboard/courses");
  });

  it("notifyPaymentSuccess includes the amount in the body", async () => {
    await notifyPaymentSuccess("u-1", "Course X", 250_000);
    const call = createNotification.mock.calls[0]?.[0] as {
      body: string;
      link?: string;
    };
    // Amount is rendered with fa-IR locale → Persian digits "۲۵۰"
    expect(call.body).toContain("۲۵۰");
    expect(call.body).toContain("Course X");
    expect(call.link).toBe("/dashboard/finance");
  });

  it("notifyGradePosted includes the score", async () => {
    await notifyGradePosted("u-1", "Course Y", 18.5);
    const call = createNotification.mock.calls[0]?.[0] as {
      body: string;
      title: string;
    };
    expect(call.body).toContain("18");
    expect(call.title).toContain("نمره");
  });

  it("notifyNewMessage mentions the sender name", async () => {
    await notifyNewMessage("u-receiver", "Ali");
    const call = createNotification.mock.calls[0]?.[0] as {
      userId: string;
      body: string;
    };
    expect(call.userId).toBe("u-receiver");
    expect(call.body).toContain("Ali");
  });

  it("notifyCertificateIssued has success type", async () => {
    await notifyCertificateIssued("u-1", "Course Z");
    const call = createNotification.mock.calls[0]?.[0] as {
      type: string;
      title: string;
    };
    expect(call.type).toBe("success");
    expect(call.title).toContain("گواهی");
  });

  it("swallows repository errors so the business action succeeds", async () => {
    createNotification.mockRejectedValueOnce(new Error("DB down"));
    await expect(notifyEnrollment("u-1", "X")).resolves.toBeUndefined();
  });
});
