import { type NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { z } from "zod";
import { CACHE_TAGS } from "@/lib/cache-tags";

const updateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(["video", "text", "quiz"]).optional(),
  videoUrl: z.string().url().nullish(),
  durationMinutes: z.number().min(1).max(600).optional(),
  sortOrder: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
  published: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await repository.findLessonById(id);
    if (!existing) {
      return NextResponse.json({ error: "درس یافت نشد" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateLessonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "داده‌های نامعتبر", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const patch: Parameters<typeof repository.updateLesson>[1] = {};
    if (parsed.data.title !== undefined) patch.title = parsed.data.title;
    if (parsed.data.type !== undefined) patch.type = parsed.data.type;
    if (parsed.data.videoUrl !== undefined) patch.videoUrl = parsed.data.videoUrl;
    if (parsed.data.durationMinutes !== undefined) patch.durationMinutes = parsed.data.durationMinutes;
    if (parsed.data.sortOrder !== undefined) patch.sortOrder = parsed.data.sortOrder;
    if (parsed.data.isFree !== undefined) patch.isFree = parsed.data.isFree;
    if (parsed.data.published !== undefined) patch.published = parsed.data.published;

    const updated = await repository.updateLesson(id, patch);
    revalidateTag(CACHE_TAGS.lessons);
    revalidateTag(CACHE_TAGS.course(existing.courseId));
    revalidateTag(CACHE_TAGS.courses);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/admin/lessons/:id]", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await repository.findLessonById(id);
    await repository.deleteLesson(id);
    revalidateTag(CACHE_TAGS.lessons);
    if (existing?.courseId) {
      revalidateTag(CACHE_TAGS.course(existing.courseId));
    }
    revalidateTag(CACHE_TAGS.courses);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/lessons/:id]", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
