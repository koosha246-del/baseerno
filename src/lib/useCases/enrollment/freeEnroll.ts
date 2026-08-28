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
  let enrollment;
  try {
    enrollment = await repository.createEnrollment({
      userId: input.userId,
      courseId: input.courseId,
    });
  } catch (err: unknown) {
    // P2002 = unique (userId, courseId) violated — a concurrent request
    // already enrolled the user. Return idempotent success with the
    // existing enrollment instead of surfacing a 500.
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      const existing = await repository.findEnrollment(input.userId, input.courseId);
      if (existing) {
        enrollment = existing;
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }

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
