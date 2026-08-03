import { NextResponse } from "next/server";
import {
  startConversation,
  startConversationSchema,
  buildUseCaseResponse,
} from "@/lib/useCases/ai/startConversation";
import { getCurrentUser } from "@/lib/auth/session";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

async function startConversationHandler(req: Request) {
  // CSRF: creates a conversation owned by the logged-in session.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  // Validate
  const parsed = startConversationSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "ورودی نامعتبر." }, { status: 422 });
  }

  // Execute business logic
  const result = await startConversation(parsed.data, { userId: user.id });
  return buildUseCaseResponse(result);
}

/**
 * SENSITIVE: max=3, burst=1 per 2 minutes.
 * (Every AI endpoint is costly — required by the product spec.)
 */
export const POST = withRateLimit(startConversationHandler, RATE_LIMIT_PRESETS.SENSITIVE, {
  keyPrefix: "ai:conversations",
});
