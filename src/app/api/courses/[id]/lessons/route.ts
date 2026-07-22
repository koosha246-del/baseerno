import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "لطفاً وارد شوید" }, { status: 401 });
    }

    const { id: courseId } = await params;

    // Verify enrollment
    const enrollment = await repository.findEnrollment(user.id, courseId);
    if (!enrollment) {
      return NextResponse.json(
        { error: "شما در این دوره ثبت‌نام نکرده‌اید" },
        { status: 403 }
      );
    }

    // Teachers & admins can see all lessons, students only published
    const lessons =
      user.role === "ADMIN" || user.role === "TEACHER"
        ? await repository.listAllLessons(courseId)
        : await repository.listLessons(courseId);

    return NextResponse.json(lessons);
  } catch (err) {
    console.error("[GET /api/courses/:id/lessons]", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
