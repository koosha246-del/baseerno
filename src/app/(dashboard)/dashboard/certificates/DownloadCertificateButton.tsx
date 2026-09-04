"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface Props {
  certificateId: string;
  certificateNumber: string;
}

/**
 * Server-side PDF download.
 *
 * This used to fetch the certificate data and run @react-pdf IN THE
 * BROWSER — shipping the whole renderer to every student and racing
 * `URL.revokeObjectURL` against the download start (which cancels the
 * download in Safari/Firefox). The /api/certificates/[id]/pdf route does
 * the same render with auth, ownership checks and a rate limit, so the
 * button is now a plain navigation.
 */
export function DownloadCertificateButton({ certificateId }: Props) {
  const [busy, setBusy] = useState(false);

  function handleDownload() {
    setBusy(true);
    // Hidden iframe triggers the download via the endpoint's
    // Content-Disposition header without navigating the page away — and,
    // unlike window.location.assign, an error response can't replace the
    // dashboard. A timer resets the spinner as a fallback in case the
    // browser starts the download without firing `load`.
    const frame = document.createElement("iframe");
    frame.hidden = true;
    frame.src = `/api/certificates/${certificateId}/pdf`;
    const cleanup = () => {
      frame.remove();
      setBusy(false);
    };
    frame.addEventListener("load", () => setTimeout(cleanup, 2000));
    frame.addEventListener("error", cleanup);
    window.setTimeout(cleanup, 30_000);
    document.body.appendChild(frame);
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={busy}
      className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-hover disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
      دانلود PDF
    </button>
  );
}
