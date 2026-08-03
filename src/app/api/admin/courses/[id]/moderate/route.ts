import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { invalidateCache, invalidateSearchCourseCache } from "@/lib/cache";
import { CACHE_TAGS, publishedCoursesCacheKeys } from "@/lib/cache-tags";
import { publish } from "@/lib/events";

const schema = z.object({
  action: z.enum(["publish", "unpublish", "delete"]),
  reason: z.string().max(500).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "عملیات نامعتبر." }, { status: 422 });
  }

  const course = await repository.findCourseById(id);
  if (!course) {
    return NextResponse.json({ error: "دوره یافت نشد." }, { status: 404 });
  }

  switch (parsed.data.action) {
    case "publish":
      await repository.updateCourse(id, { published: true });
      break;
    case "unpublish":
      await repository.updateCourse(id, { published: false });
      break;
    case "delete":
      // Soft approach: unpublish rather than hard-delete to preserve data.
      await repository.unpublishCourse(id);
      break;
  }

  // publish/unpublish changes the public list — bust Redis + tag,
  // plus the per-query search cache (published state affects results).
  await invalidateCache(publishedCoursesCacheKeys(), [
    CACHE_TAGS.courses,
    CACHE_TAGS.course(id),
    CACHE_TAGS.reports,
  ]);
  await invalidateSearchCourseCache();
  await publish({ type: "search:needs-sync", courseId: id });

  const messages: Record<string, string> = {
    publish: "دوره منتشر شد.",
    unpublish: "دوره از حالت انتشار خارج شد.",
    delete: "دوره غیرفعال شد (soft delete).",
  };
  return NextResponse.json({ ok: true, message: messages[parsed.data.action] });
}
