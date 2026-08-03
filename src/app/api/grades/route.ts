import { NextResponse } from "next/server";
import { postGrade, postGradeSchema, buildUseCaseResponse } from "@/lib/useCases/grades/postGrade";
import { getCurrentUser } from "@/lib/auth/session";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

async function postGradeHandler(req: Request) {
  // CSRF: grade submission mutates data on behalf of the teacher session.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "فقط معلم می‌تواند نمره ثبت کند." }, { status: 403 });
  }

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  // Validate
  const parsed = postGradeSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "ورودی نامعتبر." }, { status: 422 });
  }

  // Execute business logic
  const result = await postGrade({ ...parsed.data, teacherId: user.id });
  return buildUseCaseResponse(result);
}

/** API: max=20, burst=5 per minute. */
export const POST = withRateLimit(postGradeHandler, RATE_LIMIT_PRESETS.API, {
  keyPrefix: "grades:post",
});
