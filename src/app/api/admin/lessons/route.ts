import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { z } from "zod";

const createLessonSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(200),
  type: z.enum(["video", "text", "quiz"]).default("video"),
  videoUrl: z.string().url().nullish(),
  durationMinutes: z.number().min(1).max(600),
  sortOrder: z.number().min(0).default(0),
  isFree: z.boolean().default(false),
  published: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createLessonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "داده‌های نامعتبر", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const lesson = await repository.createLesson({
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      type: parsed.data.type,
      videoUrl: parsed.data.videoUrl ?? undefined,
      durationMinutes: parsed.data.durationMinutes,
      sortOrder: parsed.data.sortOrder,
      isFree: parsed.data.isFree,
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/lessons]", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
