import { NextResponse } from "next/server";
import { checkout, checkoutSchema, buildUseCaseResponse } from "@/lib/useCases/enrollment/checkout";
import { getCurrentUser } from "@/lib/auth/session";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

async function checkoutHandler(req: Request) {
  // CSRF: enrollment creates a payment record using the logged-in session.
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
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "ورودی نامعتبر." }, { status: 422 });
  }

  // Execute business logic
  const result = await checkout({ ...parsed.data, userId: user.id, userEmail: user.email });
  return buildUseCaseResponse(result);
}

/**
 * SENSITIVE: max=3, burst=1 per 2 minutes.
 * (Path is `/api/checkout` — no separate `/api/payments/checkout` in this project.)
 */
export const POST = withRateLimit(checkoutHandler, RATE_LIMIT_PRESETS.SENSITIVE, {
  keyPrefix: "payments:checkout",
});
