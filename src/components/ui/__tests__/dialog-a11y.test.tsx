import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import { ConfirmDialog } from "../dialog";

describe("ConfirmDialog — accessibility", () => {
  it("has no accessibility violations when open", async () => {
    const { container } = render(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="حذف دوره"
        description="این عملیات قابل بازگشت نیست."
      />,
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("renders with the dialog role and accessible name", () => {
    render(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="حذف دوره"
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    // Title is wired as the accessible name via aria-labelledby
    expect(dialog).toHaveAccessibleName("حذف دوره");
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="حذف دوره"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("closes on backdrop click", () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={vi.fn()}
        title="حذف"
        description="توضیح"
      />,
    );
    // Backdrop is the first sibling div — click it.
    const dialog = screen.getByRole("dialog");
    const backdrop = dialog.querySelector("[aria-hidden]");
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape key", () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={vi.fn()}
        title="حذف"
      />,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT close on Escape while loading", () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={vi.fn()}
        title="حذف"
        loading
      />,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onConfirm when the confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
        title="تأیید"
        confirmLabel="بله، حذف شود"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "بله، حذف شود" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
