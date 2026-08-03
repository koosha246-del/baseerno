import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getCurrentUser } from "@/lib/auth/session";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { env } from "@/lib/env";
import { withRateLimit } from "@/lib/api-middleware";
import { RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME || "",
  api_key: env.CLOUDINARY_API_KEY || "",
  api_secret: env.CLOUDINARY_API_SECRET || "",
});

async function uploadHandler(req: Request) {
  // CSRF: uploads are billed to our Cloudinary account, so lock the origin.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) ?? "baseerno";

  if (!file) {
    return NextResponse.json({ error: "فایل ارسال نشده." }, { status: 400 });
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "حجم فایل نباید بیشتر از ۱۰ مگابایت باشد." }, { status: 400 });
  }

  // Check type
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "فرمت فایل مجاز نیست." }, { status: 400 });
  }

  if (!env.CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json(
      { error: "سرویس آپلود پیکربندی نشده است." },
      { status: 503 }
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: file.type.startsWith("video/") ? "video" : "image",
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "آپلود فایل با خطا مواجه شد." }, { status: 500 });
  }
}

/** API: max=10, burst=3 per minute — protect Cloudinary credit consumption. */
export const POST = withRateLimit(uploadHandler, {
  windowMs: 60_000,
  max: 10,
  burst: 3,
  burstWindowMs: 10_000,
}, {
  keyPrefix: "upload",
});