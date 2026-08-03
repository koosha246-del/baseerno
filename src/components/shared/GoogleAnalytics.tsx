"use client";

import { useEffect } from "react";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google Analytics, injected client-side.
 *
 * The middleware generates a per-request CSP nonce and forwards it as the
 * `x-nonce` request header; Next.js automatically stamps it onto its own
 * inline scripts. We read the nonce from the DOM here instead of calling
 * `headers()` in the root layout — that would force the whole app into
 * dynamic rendering and defeat ISR on the course pages.
 *
 * Under `'strict-dynamic'` the nonce'd inline bootstrap is trusted, and
 * the gtag script it loads inherits trust, so GA keeps working.
 */
export function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof document === "undefined") return;

    const nonce =
      document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce ??
      undefined;

    // 1) External gtag script
    const s = document.createElement("script");
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    s.async = true;
    if (nonce) s.nonce = nonce;
    document.head.appendChild(s);

    // 2) Inline bootstrap — also nonce'd so it is allowed under
    //    script-src 'strict-dynamic' (no 'unsafe-inline' in production).
    const inline = document.createElement("script");
    if (nonce) inline.nonce = nonce;
    inline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', {
        page_path: window.location.pathname,
      });
    `;
    document.head.appendChild(inline);
  }, []);

  return null;
}
