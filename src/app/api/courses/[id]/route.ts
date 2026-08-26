import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { invalidateCache, invalidateSearchCourseCache } from "@/lib/cache";
import { CACHE_TAGS, publishedCoursesCacheKeys } from "@/lib/cache-tags";
import { publish } from "@/lib/events";

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  subtitle: z.string().min(5).optional(),
  description: z.string().min(10).optional(),
  price: z.number().nullable().optional(),
  originalPrice: z.number().nullable().optional(),
  level: z.string().optional(),
  category: z.string().optional(),
  durationHours: z.number().min(1).optional(),
  lessons: z.number().min(1).optional(),
  glyph: z.string().optional(),
  accent: z.string().optional(),
  published: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const course = await repository.findCourseById(id);
  if (!course) {
    return NextResponse.json({ error: "دوره یافت نشد." }, { status: 404 });
  }

  // Draft/unpublished courses are only visible to the owning teacher or
  // an admin — never to anonymous visitors or other roles.
  if (!course.published) {
    const user = await getCurrentUser();
    const allowed = user && (user.role === "ADMIN" || course.mentorId === user.id);
    if (!allowed) {
      return NextResponse.json({ error: "دوره یافت نشد." }, { status: 404 });
    }
  }

  return NextResponse.json({ course });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // CSRF: course update mutates the catalog.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  const { id } = await params;
  const course = await repository.findCourseById(id);
  if (!course) {
    return NextResponse.json({ error: "دوره یافت نشد." }, { status: 404 });
  }

  if (user.role !== "ADMIN" && course.mentorId !== user.id) {
    return NextResponse.json({ error: "شما مجاز به ویرایش این دوره نیستید." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "ورودی نامعتبر." }, { status: 422 });
  }

  const updated = await repository.updateCourse(id, parsed.data);
  await invalidateCache(publishedCoursesCacheKeys(), [
    CACHE_TAGS.courses,
    CACHE_TAGS.course(id),
    CACHE_TAGS.reports,
  ]);
  // Title/subtitle changes should be reflected in search immediately.
  await invalidateSearchCourseCache();
  await publish({ type: "search:needs-sync", courseId: id });
  return NextResponse.json({ course: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // CSRF: course deletion (soft-unpublish) mutates the catalog.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  const { id } = await params;
  const course = await repository.findCourseById(id);
  if (!course) {
    return NextResponse.json({ error: "دوره یافت نشد." }, { status: 404 });
  }

  if (user.role !== "ADMIN" && course.mentorId !== user.id) {
    return NextResponse.json({ error: "شما مجاز به حذف این دوره نیستید." }, { status: 403 });
  }

  await repository.unpublishCourse(id);
  await invalidateCache(publishedCoursesCacheKeys(), [
    CACHE_TAGS.courses,
    CACHE_TAGS.course(id),
    CACHE_TAGS.reports,
  ]);
  await invalidateSearchCourseCache();
  await publish({ type: "search:needs-sync", courseId: id });
  return NextResponse.json({ ok: true });
}
