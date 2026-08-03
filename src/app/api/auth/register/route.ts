import { NextResponse } from "next/server";
import { registerUser, registerSchema, buildUseCaseResponse } from "@/lib/useCases/auth/register";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

async function registerHandler(req: Request) {
  // CSRF: register sets a session cookie, so verify origin.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  // Validate
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "ورودی نامعتبر." }, { status: 422 });
  }

  // Execute business logic
  const result = await registerUser(parsed.data);
  return buildUseCaseResponse(result);
}

/** AUTH: max=5, burst=2 per minute. */
export const POST = withRateLimit(registerHandler, RATE_LIMIT_PRESETS.AUTH, {
  keyPrefix: "auth:register",
});