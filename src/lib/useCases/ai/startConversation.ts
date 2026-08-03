/**
 * UseCase: Start a new AI tutor conversation.
 *
 * Optionally scoped to a course (`courseId`) so the assistant can ground
 * its answers in the active course/lesson context.
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";

export const startConversationSchema = z.object({
  courseId: z.string().min(1).optional(),
  title: z.string().max(100).optional(),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>;

export interface StartConversationContext {
  userId: string;
}

export interface StartConversationError {
  ok: false;
  error: string;
  status: number;
}

export interface StartConversationResult {
  ok: true;
  conversation: {
    id: string;
    title: string;
    courseId: string | null;
    createdAt: string;
  };
}

export type StartConversationResponse = StartConversationResult | StartConversationError;

export async function startConversation(
  input: StartConversationInput,
  ctx: StartConversationContext,
): Promise<StartConversationResponse> {
  // When scoped to a course, make sure it exists (and is visible).
  if (input.courseId) {
    const course = await repository.findCourseById(input.courseId);
    if (!course || !course.published) {
      return { ok: false, error: "دوره یافت نشد.", status: 404 };
    }
  }

  const conversation = await repository.createConversation({
    userId: ctx.userId,
    courseId: input.courseId,
    title: input.title ?? "گفتگو با دستیار",
  });

  return {
    ok: true,
    conversation: {
      id: conversation.id,
      title: conversation.title,
      courseId: conversation.courseId,
      createdAt: conversation.createdAt.toISOString(),
    },
  };
}

/** Convert a UseCase response to a NextResponse. */
export function buildUseCaseResponse(result: StartConversationResponse): NextResponse {
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ conversation: result.conversation }, { status: 201 });
}
