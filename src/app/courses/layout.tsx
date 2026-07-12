import { SiteHeader } from "@/features/header/components/SiteHeader";

/**
 * Layout for all non-homepage routes — renders the shared sticky header
 * so course pages keep consistent navigation.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
