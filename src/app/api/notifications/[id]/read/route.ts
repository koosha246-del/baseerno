import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  const { id } = await params;
  await repository.markNotificationRead(id);

  return NextResponse.json({ ok: true });
}
