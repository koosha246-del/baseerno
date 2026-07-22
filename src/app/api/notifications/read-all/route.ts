import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";

export async function PATCH() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  await repository.markAllNotificationsRead(user.id);

  return NextResponse.json({ ok: true });
}
