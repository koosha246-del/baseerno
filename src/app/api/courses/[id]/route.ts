import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";

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
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const course = await repository.findCourseById(id);
  if (!course) {
    return NextResponse.json({ error: "دوره یافت نشد." }, { status: 404 });
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
  return NextResponse.json({ ok: true });
}
