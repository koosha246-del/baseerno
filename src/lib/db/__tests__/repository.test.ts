import { describe, it, expect } from "vitest";
import { repository } from "../repository";

describe("repository", () => {
  describe("users", () => {
    it("finds user by email", async () => {
      const user = await repository.findUserByEmail("student@baseerno.ir");
      expect(user).not.toBeNull();
      expect(user!.email).toBe("student@baseerno.ir");
      expect(user!.role).toBe("STUDENT");
    });

    it("returns null for unknown email", async () => {
      const user = await repository.findUserByEmail("nonexistent@test.com");
      expect(user).toBeNull();
    });

    it("finds safe user without password hash", async () => {
      const safe = await repository.findSafeUserById("u_student_1");
      expect(safe).not.toBeNull();
      expect(safe!.name).toBe("نیما رستگار");
      expect(safe).not.toHaveProperty("passwordHash");
    });

    it("counts users by role", async () => {
      const counts = await repository.countByRole();
      expect(counts.STUDENT).toBeGreaterThanOrEqual(3);
      expect(counts.TEACHER).toBeGreaterThanOrEqual(2);
      expect(counts.ADMIN).toBeGreaterThanOrEqual(1);
    });
  });

  describe("courses", () => {
    it("lists all courses", async () => {
      const courses = await repository.listCourses();
      expect(courses.length).toBeGreaterThanOrEqual(4);
    });

    it("filters courses by mentor", async () => {
      const courses = await repository.listCourses({ mentorId: "u_teacher_1" });
      expect(courses.length).toBeGreaterThanOrEqual(1);
      for (const c of courses) {
        expect(c.mentorId).toBe("u_teacher_1");
      }
    });
  });

  describe("enrollments", () => {
    it("lists enrollments for a user", async () => {
      const enrollments = await repository.listEnrollments("u_student_1");
      expect(enrollments.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("grades", () => {
    it("lists grades for a student", async () => {
      const grades = await repository.listGrades("u_student_1");
      expect(grades.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("payments", () => {
    it("lists payments with status filter", async () => {
      const paid = await repository.listPayments({ status: "PAID" });
      expect(paid.length).toBeGreaterThanOrEqual(3);
      for (const p of paid) {
        expect(p.status).toBe("PAID");
      }
    });

    it("calculates total revenue", async () => {
      const revenue = await repository.totalRevenue();
      expect(revenue).toBeGreaterThan(0);
    });
  });

  describe("messages", () => {
    it("lists messages for a user", async () => {
      const messages = await repository.listMessages("u_student_1");
      expect(messages.length).toBeGreaterThanOrEqual(1);
    });
  });
});
