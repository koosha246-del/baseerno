import type { Metadata } from "next";

/** Offline (PWA) page is a transient utility screen — keep it out of the SERP. */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
