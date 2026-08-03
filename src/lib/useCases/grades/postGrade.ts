/**
 * UseCase: Post a grade for a student (teacher only).
 *
 * Verifies the teacher owns the course, finds the student's enrollment,
 * creates the grade, and publishes the `grade:posted` event — the event
 * bus invalidates all 5 cache tags and notifies the student.
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";
import { publish } from "@/lib/events";

export const postGradeSchema = z.object({
  userId: z.string().min(1),
  courseId: z.string().min(1),
  score: z.number().min(0).max(20),
  feedback: z.string().max(500).optional(),
});

export type PostGradeInput = z.infer<typeof postGradeSchema>;

export interface PostGradeContext {
  teacherId: string;
}

export interface PostGradeError {
  ok: false;
  error: string;
  status: number;
}

export interface PostGradeResult {
  ok: true;
  grade: {
    id: string;
    userId: string;
    courseId: string;
    score: number;
  };
}

export type PostGradeResponse = PostGradeResult | PostGradeError;

export async function postGrade(
  input: PostGradeInput & PostGradeContext,
): Promise<PostGradeResponse> {
  const course = await repository.findCourseById(input.courseId);
  if (!course || course.mentorId !== input.teacherId) {
    return { ok: false, error: "شما مدرس این دوره نیستید.", status: 403 };
  }

  const enrollments = await repository.listEnrollmentsForCourse(input.courseId);
  const enrollment = enrollments.find((e) => e.userId === input.userId);
  if (!enrollment) {
    return { ok: false, error: "دانشجو در این دوره ثبت‌نام نکرده.", status: 404 };
  }

  const grade = await repository.createGrade({
    userId: input.userId,
    courseId: input.courseId,
    enrollmentId: enrollment.id,
    score: input.score,
    feedback: input.feedback,
    teacherId: input.teacherId,
  });

  // Event bus: revalidates grades/enrollments/course/user/reports tags and
  // notifies the student.
  await publish({
    type: "grade:posted",
    userId: input.userId,
    courseId: input.courseId,
    courseName: course.title,
    score: input.score,
  });

  return {
    ok: true,
    grade: {
      id: grade.id,
      userId: grade.userId,
      courseId: grade.courseId,
      score: grade.score,
    },
  };
}

/** Convert a UseCase response to a NextResponse. */
export function buildUseCaseResponse(result: PostGradeResponse): NextResponse {
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ grade: result.grade }, { status: 201 });
}
