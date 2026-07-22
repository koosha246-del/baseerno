"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
}

/**
 * Lightweight confirmation modal.
 *
 * No external dialog library — just a fixed overlay with backdrop
 * click + Escape-to-close. Use for destructive actions (delete) or
 * any action that benefits from explicit user confirmation.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "تأیید",
  cancelLabel = "انصراف",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, loading]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
        aria-hidden
      />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-app-border bg-surface p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="بستن"
          className="absolute left-4 top-4 rounded-md p-1 text-fg-muted transition-colors hover:bg-surface-subtle hover:text-fg-primary disabled:opacity-40"
        >
          <X className="size-4" />
        </button>

        <h2
          id="confirm-dialog-title"
          className="mb-2 text-lg font-bold text-fg-primary"
        >
          {title}
        </h2>
        {description && (
          <p className="mb-5 text-sm leading-relaxed text-fg-secondary">
            {description}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              variant === "danger" &&
                "bg-red-500 hover:bg-red-600 shadow-sm",
            )}
          >
            {loading ? "در حال پردازش..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
