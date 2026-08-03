/**
 * UseCase: Free course enrollment.
 *
 * Creates the enrollment record and publishes the `enrollment:free` event —
 * the event bus invalidates the enrollment cache tags and sends the
 * enrollment notification, so routes never call notify* or revalidateTag
 * directly.
 */

import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";
import { publish } from "@/lib/events";

export interface FreeEnrollInput {
  userId: string;
  courseId: string;
  courseName: string;
}

export interface FreeEnrollResult {
  ok: true;
  enrollment: {
    id: string;
    userId: string;
    courseId: string;
    status: string;
  };
  message: string;
  free: true;
}

export type FreeEnrollResponse = FreeEnrollResult;

export async function freeEnroll(input: FreeEnrollInput): Promise<FreeEnrollResponse> {
  const enrollment = await repository.createEnrollment({
    userId: input.userId,
    courseId: input.courseId,
  });

  // Event bus: cache invalidation (enrollmentCacheTags) + notification.
  await publish({
    type: "enrollment:free",
    userId: input.userId,
    courseId: input.courseId,
    courseName: input.courseName,
  });

  return {
    ok: true,
    enrollment: {
      id: enrollment.id,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      status: enrollment.status,
    },
    message: "ثبت‌نام رایگان با موفقیت انجام شد.",
    free: true,
  };
}

/** Convert a UseCase response to a NextResponse. */
export function buildUseCaseResponse(result: FreeEnrollResponse): NextResponse {
  return NextResponse.json({
    enrollment: result.enrollment,
    message: result.message,
    free: true,
  });
}
