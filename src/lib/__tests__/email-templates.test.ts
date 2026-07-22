import { describe, it, expect } from "vitest";
import {
  welcomeEmail,
  paymentConfirmationEmail,
  passwordResetEmail,
  contactFormEmail,
} from "../email-templates";

describe("welcomeEmail", () => {
  it("returns subject and html with the user name", () => {
    const { subject, html } = welcomeEmail("سارا");
    expect(subject).toContain("خوش");
    expect(html).toContain("سارا");
  });

  it("includes a dashboard link", () => {
    const { html } = welcomeEmail("x");
    expect(html).toContain("/dashboard");
  });
});

describe("paymentConfirmationEmail", () => {
  it("includes course name and Persian-formatted amount", () => {
    const { html } = paymentConfirmationEmail("ali", "Speaking 101", 1500000);
    expect(html).toContain("Speaking 101");
    // Persian digits
    expect(html).toMatch(/[۰-۹]/);
  });
});

describe("passwordResetEmail", () => {
  it("embeds the reset URL", () => {
    const { html } = passwordResetEmail("mary", "https://x.test/reset?token=abc");
    expect(html).toContain("https://x.test/reset?token=abc");
  });

  it("uses Persian subject", () => {
    const { subject } = passwordResetEmail("m", "https://x");
    expect(subject).toContain("بازیابی");
  });
});

describe("contactFormEmail", () => {
  it("escapes HTML special characters in user input", () => {
    const html = contactFormEmail({
      name: "<script>alert(1)</script>",
      email: "a@b.com",
      subject: "hi",
      message: "<img src=x onerror=alert(1)>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<img src=x");
  });

  it("includes a mailto reply link", () => {
    const html = contactFormEmail({
      name: "Ali",
      email: "ali@example.com",
      subject: "Hello",
      message: "Test message body",
    });
    expect(html).toContain("mailto:ali@example.com");
  });
});
