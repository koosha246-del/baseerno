// @vitest-environment node
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToBuffer, Font } from "@react-pdf/renderer";
import { CertificatePdfDocument } from "../CertificatePdfDocument";

/**
 * Regression test for the Persian-certificate bug: the PDF used
 * Helvetica/Courier (no Arabic-script glyphs), so student names / course
 * titles rendered as blank boxes. Ensuring `Vazirmatn` is registered and
 * embedded is the contract this guards — it also catches a future
 * accidentally-reverted `pdfFonts` import.
 *
 * Runs in the NODE env (renderToBuffer reads the TTF from disk), unlike the
 * jsdom default of this suite. `@react-pdf`'s Font registry is a process
 * singleton, so we assert both that a render succeeds AND that the emitted
 * PDF references the Vazirmatn face.
 */
describe("CertificatePdfDocument — Persian font", () => {
  const props = {
    studentName: "زهرا محمدی",
    courseTitle: "انگلیسی از صفر",
    certificateNumber: "BN-2026-0007",
    issueDate: "2026-08-28",
    durationHours: 18,
    mentorName: "خانم سارا محمدی",
  };

  it("registers Vazirmatn on module load", () => {
    expect(Font.getRegisteredFontFamilies()).toContain("Vazirmatn");
  });

  it("renders a PDF that embeds the Vazirmatn face", async () => {
    // renderToBuffer's declared param is ReactElement<DocumentProps> —
    // narrower than any user component's element type; the render walk
    // doesn't care, so cast at the call boundary.
    const element = React.createElement(
      CertificatePdfDocument,
      props,
    ) as unknown as Parameters<typeof renderToBuffer>[0];
    const buf = await renderToBuffer(element);
    expect(buf.length).toBeGreaterThan(1000);
    // Font names appear in the PDF's /BaseFont resource entries.
    expect(buf.toString("latin1")).toContain("Vazirmatn");
  });
});
