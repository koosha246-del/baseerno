import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock setup ──────────────────────────────────────────────────────
// Vitest hoists vi.mock() factories above const declarations — shared
// mocks must be created inside vi.hoisted().
const { mockSend, mockResendApiKey, emailOutboxCreate } = vi.hoisted(() => {
  // Mutable so tests can toggle the API key across describe blocks.
  const state: { current: string | undefined } = { current: undefined };
  return {
    mockSend: vi.fn(),
    mockResendApiKey: state,
    emailOutboxCreate: vi.fn(),
  };
});

vi.mock("resend", () => ({
  Resend: vi.fn(function () {
    return {
      emails: {
        send: (...args: unknown[]) => mockSend(...args),
      },
    };
  }),
}));

vi.mock("@/lib/env", () => ({
  env: {
    get RESEND_API_KEY() {
      return mockResendApiKey.current;
    },
    isProduction: false,
    isDevelopment: true,
    isTest: true,
  },
}));

vi.mock("@/config/site", () => ({
  siteConfig: {
    name: "بصیر نو",
    url: "https://baseerno.ir",
    contact: { email: "info@baseerno.ir" },
  },
}));

// email.ts → email-queue.ts imports prisma-client at module scope; stub it
// so the import graph loads without a real DATABASE_URL.
vi.mock("@/lib/db/prisma-client", () => ({
  prisma: { emailOutbox: { create: emailOutboxCreate } },
}));

import { sendEmail } from "../email";

describe("email", () => {
  const testEmail = {
    to: "student@test.com",
    subject: "خوش آمدید",
    html: "<p>Welcome!</p>",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    emailOutboxCreate.mockResolvedValue({ id: "e_1" });
  });

  describe("when RESEND_API_KEY is not set", () => {
    beforeEach(() => {
      mockResendApiKey.current = undefined;
    });

    it("logs to console and returns true", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const result = await sendEmail(testEmail);
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[EMAIL MOCK]"),
      );
      consoleSpy.mockRestore();
    });
  });

  describe("when RESEND_API_KEY is set", () => {
    beforeEach(() => {
      mockResendApiKey.current = "re_abc123";
    });

    it("sends email via Resend and returns true on success", async () => {
      mockSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

      const result = await sendEmail(testEmail);
      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "student@test.com",
          subject: "خوش آمدید",
        }),
      );
    });

    it("falls back to the outbox and returns true when Resend throws", async () => {
      mockSend.mockRejectedValue(new Error("API Error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const result = await sendEmail(testEmail);
      // Never fail the request — the worker retries from the outbox.
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      expect(emailOutboxCreate).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
