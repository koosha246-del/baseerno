import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { findBook } from "@/lib/library";
import { verifyDownloadToken } from "@/lib/library-token";

/**
 * GET /api/library/[id]/download?token=...
 *
 * Verifies the signed download token, then streams the file from the
 * public/ tree. Only files listed in the library catalog are served —
 * the book id is validated against `findBook()` before any disk access.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "توکن دانلود ارائه نشده است." },
      { status: 401 },
    );
  }

  const payload = verifyDownloadToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "توکن نامعتبر یا منقضی شده است." },
      { status: 401 },
    );
  }

  if (payload.bookId !== id) {
    return NextResponse.json(
      { error: "توکن با کتاب درخواست‌شده مطابقت ندارد." },
      { status: 403 },
    );
  }

  const book = findBook(id);
  if (!book) {
    return NextResponse.json({ error: "کتاب پیدا نشد." }, { status: 404 });
  }

  // Resolve the file path. The catalog stores a public URL like
  // `/library/foo.jpg`; strip the leading slash to anchor it under public/.
  const relative = book.file.replace(/^\//, "");
  const absolute = path.join(process.cwd(), "public", relative);

  // Defense in depth: ensure the resolved path stays inside `public/`.
  const publicRoot = path.join(process.cwd(), "public");
  if (!absolute.startsWith(publicRoot)) {
    return NextResponse.json({ error: "مسیر فایل نامعتبر است." }, { status: 400 });
  }

  try {
    await stat(absolute);
  } catch {
    return NextResponse.json(
      { error: "فایل کتاب در سرور یافت نشد." },
      { status: 404 },
    );
  }

  const buffer = await readFile(absolute);
  const ext = path.extname(absolute).toLowerCase();
  const contentType =
    ext === ".pdf"
      ? "application/pdf"
      : ext === ".epub"
        ? "application/epub+zip"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".png"
            ? "image/png"
            : "application/octet-stream";

  const filename = `${book.id}${ext}`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.byteLength),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
