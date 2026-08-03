import { describe, it, expect, vi, afterEach } from "vitest";
import { timeAgo } from "../time";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("timeAgo", () => {
  it('returns "همین الان" for the current time', () => {
    expect(timeAgo(Date.now())).toBe("همین الان");
  });

  it('returns "همین الان" for a future timestamp', () => {
    expect(timeAgo(Date.now() + 60_000)).toBe("همین الان");
  });

  it('returns "همین الان" for less than a minute ago', () => {
    expect(timeAgo(Date.now() - 30_000)).toBe("همین الان");
  });

  it('returns "X دقیقه پیش" for minutes', () => {
    expect(timeAgo(Date.now() - 5 * 60_000)).toBe("۵ دقیقه پیش");
  });

  it('returns "X دقیقه پیش" for 1 minute', () => {
    expect(timeAgo(Date.now() - 60_000)).toBe("۱ دقیقه پیش");
  });

  it('returns "X ساعت پیش" for hours', () => {
    expect(timeAgo(Date.now() - 3 * 60 * 60_000)).toBe("۳ ساعت پیش");
  });

  it('returns "X روز پیش" for days', () => {
    expect(timeAgo(Date.now() - 10 * 24 * 60 * 60_000)).toBe("۱۰ روز پیش");
  });

  it('returns "X ماه پیش" for months', () => {
    expect(timeAgo(Date.now() - 45 * 24 * 60 * 60_000)).toBe("۱ ماه پیش");
  });

  it('returns "X سال پیش" for years', () => {
    expect(timeAgo(Date.now() - 400 * 24 * 60 * 60_000)).toBe("۱ سال پیش");
  });

  it('returns "۲ سال پیش" for 2+ years', () => {
    expect(timeAgo(Date.now() - 800 * 24 * 60 * 60_000)).toBe("۲ سال پیش");
  });

  it("handles Date object input", () => {
    expect(timeAgo(new Date(Date.now() - 2 * 60_000))).toBe("۲ دقیقه پیش");
  });

  it("handles ISO string input", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(timeAgo(past)).toBe("۱ دقیقه پیش");
  });

  it('returns "—" for invalid date string', () => {
    expect(timeAgo("not-a-date")).toBe("—");
  });

  it('returns "—" for NaN timestamp', () => {
    expect(timeAgo(NaN)).toBe("—");
  });
});
