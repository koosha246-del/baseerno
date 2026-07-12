import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";

export async function POST(req: Request) {
  // CSRF: prevent a malicious site from logging the user out.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}
