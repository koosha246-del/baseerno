import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { withRateLimit, handleApiError } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

async function handler() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }
  return NextResponse.json({ user });
}

/** READ: max=60, burst=10 per minute. */
export const GET = withRateLimit(async () => {
  const correlationId = crypto.randomUUID();
  try {
    return await handler();
  } catch (error) {
    return handleApiError(error, correlationId);
  }
}, RATE_LIMIT_PRESETS.READ, {
  keyPrefix: "auth:me",
});
