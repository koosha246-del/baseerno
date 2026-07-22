"use client";

import { pdf } from "@react-pdf/renderer";
import { CertificatePdfDocument } from "@/components/certificates/CertificatePdfDocument";

interface Props {
  certificateId: string;
  certificateNumber: string;
}

export function DownloadCertificateButton({ certificateId, certificateNumber }: Props) {
  async function handleDownload() {
    try {
      const res = await fetch(`/api/certificates/${certificateId}/data`);
      if (!res.ok) throw new Error("Failed to fetch certificate data");
      const data = await res.json();

      const blob = await pdf(
        <CertificatePdfDocument
          studentName={data.studentName}
          courseTitle={data.courseTitle}
          certificateNumber={data.certificateNumber}
          issueDate={data.issueDate}
          durationHours={data.durationHours}
          mentorName={data.mentorName}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${certificateNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("خطا در تولید PDF");
    }
  }

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-hover"
    >
      دانلود PDF
    </button>
  );
}
