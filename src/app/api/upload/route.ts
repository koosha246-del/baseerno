import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getCurrentUser } from "@/lib/auth/session";
import { isSameOriginRequest, csrfRejectedResponse } from "@/lib/csrf";
import { env } from "@/lib/env";
import { withRateLimit } from "@/lib/api-middleware";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME || "",
  api_key: env.CLOUDINARY_API_KEY || "",
  api_secret: env.CLOUDINARY_API_SECRET || "",
});

/** Folders the client may write into — anything else is rejected. */
const ALLOWED_FOLDERS = ["baseerno", "avatars", "lessons"];

const MIME_MAGIC_BYTES: Array<{ mime: string; magic: (buf: Buffer) => boolean }> = [
  // JPEG: FF D8 FF
  { mime: "image/jpeg", magic: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  {
    mime: "image/png",
    magic: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  // WEBP: "RIFF" .... "WEBP"
  {
    mime: "image/webp",
    magic: (b) =>
      b.length >= 12 &&
      b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP",
  },
  // GIF: "GIF87a" | "GIF89a"
  {
    mime: "image/gif",
    magic: (b) =>
      b.length >= 6 && (b.toString("latin1", 0, 6) === "GIF87a" || b.toString("latin1", 0, 6) === "GIF89a"),
  },
  // MP4 (ftyp): bytes 4..8 == "ftyp"
  { mime: "video/mp4", magic: (b) => b.length >= 12 && b.toString("latin1", 4, 8) === "ftyp" },
  // WEBM: EBML header (0x1A 0x45 0xDF 0xA3)
  { mime: "video/webm", magic: (b) => b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
];

/** Reject uploads whose magic bytes don't match an allowed type. */
function sniffMime(buffer: Buffer): string | null {
  for (const candidate of MIME_MAGIC_BYTES) {
    if (candidate.magic(buffer)) return candidate.mime;
  }
  return null;
}

async function uploadHandler(req: Request) {
  // CSRF: uploads are billed to our Cloudinary account, so lock the origin.
  if (!isSameOriginRequest(req)) {
    return csrfRejectedResponse();
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "احراز هویت نشده." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    // Malformed multipart body — same 400 contract as every other bad input.
    return NextResponse.json({ error: "بدنه درخواست نامعتبر است." }, { status: 400 });
  }
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) ?? "baseerno";

  if (!file) {
    return NextResponse.json({ error: "فایل ارسال نشده." }, { status: 400 });
  }

  // Restrict the Cloudinary folder to a known allowlist — never let the
  // client invent arbitrary folder paths. The `lessons/` folder holds
  // course authoring assets billed to our account, so it additionally
  // requires TEACHER/ADMIN (matches every lesson-management route).
  if (folder === "lessons" || folder.startsWith("lessons/")) {
    if (user.role !== "TEACHER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
    }
  }
  if (!ALLOWED_FOLDERS.some((p) => folder === p || folder.startsWith(`${p}/`))) {
    return NextResponse.json({ error: "پوشه مجاز نیست." }, { status: 400 });
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "حجم فایل نباید بیشتر از ۱۰ مگابایت باشد." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Never trust the client-declared MIME type — sniff the actual bytes.
  const sniffed = sniffMime(buffer);
  if (!sniffed) {
    return NextResponse.json({ error: "فرمت فایل مجاز نیست." }, { status: 400 });
  }

  if (!env.CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json(
      { error: "سرویس آپلود پیکربندی نشده است." },
      { status: 503 }
    );
  }

  try {
    const base64 = buffer.toString("base64");
    const dataUri = `data:${sniffed};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: sniffed.startsWith("video/") ? "video" : "image",
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