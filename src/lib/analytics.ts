/**
 * Analytics helpers — event tracking abstraction.
 *
 * Swap the implementation to use any analytics provider
 * (GA4, Plausible, Mixpanel, PostHog, etc.) without touching feature code.
 */

type EventName = string;
type EventProps = Record<string, string | number | boolean | undefined>;

/**
 * Track a user event (click, view, submit, etc.).
 * No-op in development; wire to your analytics provider for production.
 */
export function trackEvent(name: EventName, props?: EventProps): void {
  if (process.env.NODE_ENV === "development") return;

  // Example: Google Analytics 4
  if (typeof window !== "undefined" && "gtag" in window) {
    const gtag = (window as Record<string, unknown>)["gtag"] as
      | ((...args: unknown[]) => void)
      | undefined;
    gtag?.("event", name, props);
  }
}

/**
 * Track a page view. Called by route-change watchers if needed
 * beyond Next.js's built-in pageview reporting.
 */
export function trackPageView(path: string): void {
  trackEvent("page_view", { page_path: path });
}
