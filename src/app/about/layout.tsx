import { SiteChrome } from "@/app/site-chrome";

export default function ChromeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome>{children}</SiteChrome>;
}