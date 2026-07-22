import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [courses, messages, users] = await Promise.all([
    repository.searchCourses(q, 5),
    repository.searchMessages(user.id, q, 5),
    user.role === "ADMIN" ? repository.searchUsers(q, 5) : Promise.resolve([]),
  ]);

  const results = [
    ...courses.map((c) => ({
      type: "course" as const,
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      link: `/dashboard/courses`,
    })),
    ...messages.map((m) => ({
      type: "message" as const,
      id: m.id,
      title: m.body.slice(0, 80) + (m.body.length > 80 ? "..." : ""),
      subtitle: new Date(m.sentAt).toLocaleDateString("fa-IR"),
      link: `/dashboard/messages`,
    })),
    ...users.map((u) => ({
      type: "user" as const,
      id: u.id,
      title: u.name,
      subtitle: u.email,
      link: `/dashboard/users`,
    })),
  ];

  return NextResponse.json({ results });
}
