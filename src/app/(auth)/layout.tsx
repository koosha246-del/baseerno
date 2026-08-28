import type { Metadata } from "next";

/**
 * Auth flow pages (login/register) are utility/private — noindex keeps them
 * out of the SERP and avoids thin, low-value results for the brand query.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
