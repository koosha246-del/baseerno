import Link from "next/link";
import { Printer } from "lucide-react";

interface Props {
  /** Route segment id of the certificate. */
  certificateId: string;
}

/**
 * "نسخه چاپی" — links to the print-optimized HTML view of the
 * certificate. The route existed before but nothing linked to it, so the
 * Persian-correct view was unreachable in practice (while the client-side
 * PDF renderer produced Helvetica garbage until it too was fixed).
 * window.print() from that view yields a faithful PDF on any browser.
 */
export function PrintCertificateLink({ certificateId }: Props) {
  return (
    <Link
      href={`/dashboard/certificates/${certificateId}/print`}
      className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:border-white/30 hover:bg-white/5"
    >
      <Printer className="size-3.5" />
      نسخه چاپی
    </Link>
  );
}
