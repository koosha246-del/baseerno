import { describe, it, expect } from "vitest";
import { CACHE_TAGS, enrollmentCacheTags } from "../cache-tags";

describe("cache-tags", () => {
  describe("CACHE_TAGS constants", () => {
    it("has the expected base tags", () => {
      expect(CACHE_TAGS.users).toBe("users");
      expect(CACHE_TAGS.courses).toBe("courses");
      expect(CACHE_TAGS.payments).toBe("payments");
      expect(CACHE_TAGS.enrollments).toBe("enrollments");
      expect(CACHE_TAGS.grades).toBe("grades");
      expect(CACHE_TAGS.messages).toBe("messages");
      expect(CACHE_TAGS.notifications).toBe("notifications");
      expect(CACHE_TAGS.certificates).toBe("certificates");
      expect(CACHE_TAGS.lessons).toBe("lessons");
      expect(CACHE_TAGS.reports).toBe("admin:reports");
      expect(CACHE_TAGS.newsletter).toBe("newsletter");
    });
  });

  describe("dynamic tags", () => {
    it("CACHE_TAGS.course generates a course-specific tag", () => {
      expect(CACHE_TAGS.course("course-1")).toBe("course:course-1");
    });

    it("CACHE_TAGS.user generates a user-specific tag", () => {
      expect(CACHE_TAGS.user("user-42")).toBe("user:user-42");
    });
  });

  describe("enrollmentCacheTags", () => {
    it("returns all 6 expected tags", () => {
      const tags = enrollmentCacheTags("user-1", "course-1");
      expect(tags).toHaveLength(6);
      expect(tags).toContain("enrollments");
      expect(tags).toContain("payments");
      expect(tags).toContain("admin:reports");
      expect(tags).toContain("user:user-1");
      expect(tags).toContain("course:course-1");
      expect(tags).toContain("courses");
    });

    it("generates unique tags for different users and courses", () => {
      const tags1 = enrollmentCacheTags("user-1", "course-A");
      const tags2 = enrollmentCacheTags("user-2", "course-B");
      expect(tags1).not.toEqual(tags2);
      expect(tags1).toContain("user:user-1");
      expect(tags2).toContain("user:user-2");
      expect(tags1).toContain("course:course-A");
      expect(tags2).toContain("course:course-B");
    });
  });
});
