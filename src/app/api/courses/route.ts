import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";

const createSchema = z.object({
  title: z.string().min(3),
  subtitle: z.string().min(5),
  description: z.string().min(10),
  price: z.number().nullable(),
  originalPrice: z.number().nullable().optional(),
  level: z.string().default("مقدماتی"),
  category: z.string().min(1),
  durationHours: z.number().min(1),
  lessons: z.number().min(1),
  glyph: z.string().default("📚"),
  accent: z.string().default("blue"),
  published: z.boolean().default(true),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mentorId = searchParams.get("mentorId") ?? undefined;
  const publishedOnly = searchParams.get("published") === "true";

  const courses = await repository.listCourses({ mentorId, publishedOnly });
  return NextResponse.json({ courses });
}

export async function POST(req: Request) {
  // CSRF: course creation mutates the catalog as the logged-in teacher/admin.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "فقط معلم یا مدیر می‌تواند دوره ایجاد کند." }, { status: 403 });
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
  return NextResponse.json({ course }, { status: 201 });
}
