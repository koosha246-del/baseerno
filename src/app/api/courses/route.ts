import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { invalidateCache, invalidateSearchCourseCache } from "@/lib/cache";
import { CACHE_TAGS, publishedCoursesCacheKeys } from "@/lib/cache-tags";
import { publish } from "@/lib/events";

const createSchema = z.object({
  title: z.string().min(3),
  subtitle: z.string().min(5),
  description: z.string().min(10),
  price: z.number().min(0).nullable(),
  originalPrice: z.number().min(0).nullable().optional(),
  level: z.string().default("مقدماتی"),
  category: z.string().min(1),
  durationHours: z.number().min(1),
  lessons: z.number().min(1),
  glyph: z.string().default("📚"),
  accent: z.string().default("blue"),
  published: z.boolean().default(true),
});

async function listCoursesHandler(req: Request) {
  const { searchParams } = new URL(req.url);
  const mentorId = searchParams.get("mentorId") ?? undefined;

  // Public listing is published-only by default. Drafts are exposed only
  // to authenticated course owners / admins — an anonymous caller can
  // never request `?published=false`.
  const requestedPublished = searchParams.get("published");
  const wantsDrafts = requestedPublished === "false";

  // Pagination: default 20, hard cap 100, integers only. List views select
  // only the columns the catalog needs — skips shipping `description`.
  const rawTake = searchParams.get("take");
  const parsedTake = rawTake === null ? NaN : Number.parseInt(rawTake, 10);
  const take = Number.isNaN(parsedTake)
    ? 20
    : Math.min(Math.max(parsedTake, 1), 100);
  const rawSkip = Number.parseInt(searchParams.get("skip") ?? "0", 10);
  const skip = Number.isNaN(rawSkip) || rawSkip < 0 ? 0 : rawSkip;

  if (wantsDrafts) {
    const user = await getCurrentUser();
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز." },
        { status: 403 },
      );
    }
    // A TEACHER may only list their own drafts unless explicitly scoping
    // to a mentorId they own; admins may see everything.
    const effectiveMentorId =
      user.role === "ADMIN" ? mentorId : user.id;
    const courses = await repository.listCourses({
      mentorId: effectiveMentorId,
      publishedOnly: false,
      take,
      skip,
    });
    return NextResponse.json({ courses });
  }

  const courses = await repository.listCourses({
    mentorId,
    publishedOnly: true,
    take,
    skip,
  });
  return NextResponse.json({ courses }, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate" },
  });
}

async function createCourseHandler(req: Request) {
  // CSRF: course creation mutates the catalog as the logged-in teacher/admin.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
    return NextResponse.json(
      { error: "فقط معلم یا مدیر می‌تواند دوره ایجاد کند." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "ورودی نامعتبر." }, { status: 422 });
  }

  const course = await repository.createCourse({
    ...parsed.data,
    rating: 0,
    mentorId: user.id,
  });
  // Bust the Redis course-list keys AND the Next.js `courses` tag, plus
  // every per-query search cache entry (new course → searchable now).
  await invalidateCache(publishedCoursesCacheKeys(), [
    CACHE_TAGS.courses,
    CACHE_TAGS.reports,
  ]);
  await invalidateSearchCourseCache();
  await publish({ type: "search:needs-sync", courseId: course.id });
  return NextResponse.json({ course }, { status: 201 });
}

/** READ: max=60, burst=10 per minute — public course listing. */
export const GET = withRateLimit(listCoursesHandler, RATE_LIMIT_PRESETS.READ, {
  keyPrefix: "courses:list",
});

/** API: max=20, burst=5 — course creation (mutations). */
export const POST = withRateLimit(createCourseHandler, RATE_LIMIT_PRESETS.API, {
  keyPrefix: "courses:create",
});
