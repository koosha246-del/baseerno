import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { repository } from "@/lib/db/repository";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(3, "نام باید حداقل ۳ حرف باشد.").optional(),
  phone: z.string().optional(),
  bio: z.string().max(500, "بیوگرافی حداکثر ۵۰۰ کاراکتر.").optional(),
});

async function updateProfileHandler(req: Request) {
  // CSRF: profile update mutates the authenticated user's record.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "ورودی نامعتبر." }, { status: 422 });
  }

  const updated = await repository.updateUser(user.id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
  }

  revalidateTag(CACHE_TAGS.users);
  revalidateTag(CACHE_TAGS.user(user.id));

  return NextResponse.json({ user: updated });
}

/** API: max=20, burst=5 per minute. */
export const PATCH = withRateLimit(updateProfileHandler, RATE_LIMIT_PRESETS.API, {
  keyPrefix: "user:profile",
});