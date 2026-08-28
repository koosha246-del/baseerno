import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { ContactForm } from "../ContactForm";

describe("ContactForm — accessibility", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("has no accessibility violations in its initial state", async () => {
    const { container } = render(<ContactForm />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("wires field errors via aria-describedby and aria-invalid", async () => {
    render(<ContactForm />);

    // Submit the empty (noValidate) form to trigger client validation.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /ارسال پیام/ }));
    });

    const nameInput = screen.getByLabelText(/نام و نام/);
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    expect(nameInput).toHaveAttribute("aria-describedby", "name-error");
    // The error text is programmatically linked to the field.
    expect(document.getElementById("name-error")).toHaveTextContent(/حداقل ۳ حرف/);

    const emailInput = screen.getByLabelText(/ایمیل/);
    expect(emailInput).toHaveAttribute("aria-invalid", "true");
    expect(emailInput).toHaveAttribute("aria-describedby", "email-error");
  });

  it("announces async success via an aria-live polite region", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: "پیام شما ارسال شد." }),
      }),
    );

    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/نام و نام/), {
      target: { value: "سارا محمدی" },
    });
    fireEvent.change(screen.getByLabelText(/ایمیل/), {
      target: { value: "sara@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/موضوع/), {
      target: { value: "سوال درباره دوره‌ها" },
    });
    fireEvent.change(screen.getByLabelText(/پیام شما/), {
      target: { value: "من درباره ثبت‌نام در دوره‌ی برنامه‌نویسی سوال دارم و می‌خواهم اطلاعات بیشتری بگیرم." },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /ارسال پیام/ }));
    });

    const status = await screen.findByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(within(status).getByText("پیام شما ارسال شد.")).toBeInTheDocument();
    // Submission intent is announced, not a hidden static element.
    expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/contact", expect.any(Object));
  });
});
