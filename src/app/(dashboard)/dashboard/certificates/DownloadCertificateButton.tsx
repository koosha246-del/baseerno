"use client";

import Link from "next/link";
import { Printer } from "lucide-react";

interface DownloadCertificateButtonProps {
  certificateId: string;
  certificateNumber: string;
}

export function DownloadCertificateButton({
  certificateId,
  certificateNumber: _certificateNumber,
}: DownloadCertificateButtonProps) {
  return (
    <Link
      href={`/dashboard/certificates/${certificateId}/print`}
      target="_blank"
      className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-accent-hover"
    >
      <Printer className="size-3" />
      دانلود / چاپ
    </Link>
  );
}
