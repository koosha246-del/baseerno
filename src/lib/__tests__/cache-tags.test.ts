import { describe, it, expect } from "vitest";
import {
  CACHE_TAGS,
  CACHE_KEYS,
  HOMEPAGE_COURSES_TAKE,
  publishedCoursesCacheKeys,
  enrollmentCacheTags,
} from "../cache-tags";

describe("cache-tags", () => {
  it("defines a user tag per user id", () => {
    expect(CACHE_TAGS.user("u-1")).toBe("user:u-1");
    expect(CACHE_TAGS.course("c-1")).toBe("course:c-1");
  });

  it("publishedCoursesCacheKeys covers the shared and take-specific keys", () => {
    const keys = publishedCoursesCacheKeys();
    expect(keys).toContain(CACHE_KEYS.publishedCourses);
    expect(keys).toContain(`courses:published:${HOMEPAGE_COURSES_TAKE}`);
  });

  it("enrollmentCacheTags busts every relevant tag", () => {
    const tags = enrollmentCacheTags("u-1", "c-2");
    expect(tags).toContain("enrollments");
    expect(tags).toContain("payments");
    expect(tags).toContain("admin:reports");
    expect(tags).toContain("user:u-1");
    expect(tags).toContain("course:c-2");
    expect(tags).toContain("courses");
  });
});
