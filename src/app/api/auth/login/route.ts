import { NextResponse } from "next/server";
import { loginUser, loginSchema, buildUseCaseResponse } from "@/lib/useCases/auth/login";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

async function loginHandler(req: Request) {
  // CSRF: login doesn't need an existing session, but it does set a cookie,
  // so we still verify the request origin to prevent login-CSRF attacks.
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
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "ورودی نامعتبر." }, { status: 422 });
  }

  // Execute business logic
  const result = await loginUser(parsed.data);
  return buildUseCaseResponse(result);
}

/** AUTH: max=5, burst=2 per minute (sliding window). */
export const POST = withRateLimit(loginHandler, RATE_LIMIT_PRESETS.AUTH, {
  keyPrefix: "auth:login",
});
