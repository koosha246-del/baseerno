import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";

/**
 * PATCH /api/messages/[id]/read
 *
 * Marks a single message as read. Authorization: the caller must be
 * either the sender or the receiver of the message. The check is
 * enforced atomically inside `markMessageReadForUser`, so a caller
 * who is not a participant can neither observe nor mutate the
 * record (closing the IDOR that the previous fetch-then-update flow
 * had).
 */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  const { id } = await params;

  const message = await repository.markMessageReadForUser(id, user.id);
  if (!message) {
    // Same response whether the id is unknown or the caller is not a
    // participant — we never leak which case it was.
    return NextResponse.json(
      { error: "پیام پیدا نشد یا دسترسی ندارید." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
