"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (url: string) => void;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  currentUrl?: string;
  label?: string;
}

export function FileUpload({
  onUpload,
  folder = "baseerno",
  accept = "image/*",
  maxSizeMB = 10,
  className,
  currentUrl,
  label = "آپلود فایل",
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`حجم فایل نباید بیشتر از ${maxSizeMB} مگابایت باشد.`);
      return;
    }

    // Show preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "خطای آپلود");
      }

      setPreview(data.url);
      onUpload(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای آپلود");
      setPreview(currentUrl ?? null);
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleRemove() {
    setPreview(null);
    onUpload("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <label className="text-xs font-medium text-slate-400">{label}</label>}

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="پیش‌نمایش"
            className="h-32 w-32 rounded-xl object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -left-2 -top-2 flex size-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors",
            dragging
              ? "border-accent bg-accent-soft"
              : "border-white/10 bg-white/5 hover:border-accent/40"
          )}
        >
          {uploading ? (
            <Loader2 className="size-8 animate-spin text-accent" />
          ) : (
            <>
              <Upload className="size-8 text-slate-500" />
              <span className="text-sm text-slate-400">{label}</span>
              <span className="text-xs text-slate-500">
                حداکثر {maxSizeMB} مگابایت
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
