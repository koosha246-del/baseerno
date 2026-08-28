import { Font } from "@react-pdf/renderer";

/**
 * Font registration for certificate PDFs.
 *
 * Standard PDF fonts (Helvetica/Courier) contain NO Arabic-script glyphs
 * and no bidi/shaping engine, so Persian text rendered with them came out
 * as blank boxes. Registering the self-hosted Vazirmatn TTFs lets
 * @react-pdf render proper Persian (it ships a bidi + script-itemizing
 * text engine; the text style just needs `direction: "rtl"`).
 *
 * Font.register paths differ per environment:
 *  - browser render (`pdf(...).toBlob()`): URL relative to the site root.
 *  - node render (renderToBuffer in /api/certificates/[id]/pdf): path
 *    relative to the server cwd, which contains `public/` in both the
 *    Next standalone output and the Docker image.
 */
const isBrowser = typeof window !== "undefined";

let registered = false;

export function ensureCertificateFonts(): void {
  if (registered) return;
  registered = true;
  Font.register({
    family: "Vazirmatn",
    fonts: [
      {
        src: isBrowser
          ? "/fonts/Vazirmatn-Regular.ttf"
          : "./public/fonts/Vazirmatn-Regular.ttf",
        fontWeight: 400,
      },
      {
        src: isBrowser ? "/fonts/Vazirmatn-Bold.ttf" : "./public/fonts/Vazirmatn-Bold.ttf",
        fontWeight: 700,
      },
    ],
  });
}
