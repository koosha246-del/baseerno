"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Video,
  FileText,
  CheckCircle2,
  Loader2,
  Upload,
  Link2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_VIDEO_BYTES = 80 * 1024 * 1024; // 80MB

const lessonSchema = z.object({
  title: z.string().min(1, "عنوان درس الزامی است").max(200),
  type: z.enum(["video", "text", "quiz"]),
  /** A remote URL OR a Cloudinary URL returned by the upload API. */
  videoUrl: z.string().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().min(1, "مدت حداقل ۱ دقیقه").max(600),
  sortOrder: z.coerce.number().min(0).default(0),
  isFree: z.boolean().default(false),
  published: z.boolean().default(true),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface LessonFormProps {
  courseId: string;
  /** Existing lesson to edit; omit to create a new one. */
  lesson?: {
    id: string;
    title: string;
    type: string;
    videoUrl: string | null;
    durationMinutes: number;
    sortOrder: number;
    isFree: boolean;
    published: boolean;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const LESSON_TYPES = [
  { value: "video", label: "ویدیو", icon: Video },
  { value: "text", label: "متن", icon: FileText },
] as const;

type VideoSource = "url" | "upload";

export function LessonForm({ courseId, lesson, onSuccess, onCancel }: LessonFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoSource, setVideoSource] = useState<VideoSource>("url");
  const [uploadProgress, setUploadProgress] = useState<"idle" | "uploading" | "done" | "error">(
    "idle",
  );
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; url: string } | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: lesson?.title ?? "",
      type: (lesson?.type as LessonFormData["type"]) ?? "video",
      videoUrl: lesson?.videoUrl ?? "",
      durationMinutes: lesson?.durationMinutes ?? 5,
      sortOrder: lesson?.sortOrder ?? 0,
      isFree: lesson?.isFree ?? false,
      published: lesson?.published ?? true,
    },
  });

  const selectedType = watch("type");
  const currentVideoUrl = watch("videoUrl") ?? "";

  async function handleFileUpload(file: File) {
    setUploadProgress("uploading");
    setServerError(null);

    if (file.size > MAX_VIDEO_BYTES) {
      setServerError(`حجم فایل نباید بیشتر از ۸۰ مگابایت باشد.`);
      setUploadProgress("error");
      return;
    }
    if (!file.type.startsWith("video/")) {
      setServerError("فقط فایل ویدیویی مجاز است.");
      setUploadProgress("error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", `lessons/${courseId}`);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "خطا در آپلود فایل.");
      }
      setValue("videoUrl", data.url, { shouldValidate: true });
      setUploadedFile({ name: file.name, size: file.size, url: data.url });
      setUploadProgress("done");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "خطای ناشناخته در آپلود.");
      setUploadProgress("error");
    }
  }

  function onSubmit(data: LessonFormData) {
    setIsSubmitting(true);
    setServerError(null);

    const payload = {
      courseId,
      ...(lesson ? { lessonId: lesson.id } : {}),
      title: data.title,
      type: data.type,
      videoUrl: data.type === "video" && data.videoUrl ? data.videoUrl : null,
      durationMinutes: data.durationMinutes,
      sortOrder: data.sortOrder,
      isFree: data.isFree,
      published: data.published,
    };

    const method = lesson ? "PATCH" : "POST";
    const url = lesson ? `/api/admin/lessons/${lesson.id}` : "/api/admin/lessons";

    return fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const result = await res.json().catch(() => ({}));
        if (!res.ok || result.error) {
          throw new Error(result.error ?? "خطایی رخ داد.");
        }
        setSuccess(true);
        reset();
        setUploadedFile(null);
        setUploadProgress("idle");
        onSuccess?.();
      })
      .catch((err: Error) => {
        setServerError(err.message || "خطایی در ذخیره درس رخ داد.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 className="size-12 text-status-success" />
        <p className="font-bold text-fg-primary">
          {lesson ? "درس با موفقیت ویرایش شد!" : "درس جدید اضافه شد!"}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSuccess(false);
            reset();
          }}
        >
          {lesson ? "ویرایش مجدد" : "افزودن درس دیگر"}
        </Button>
      </div>
    );
  }

  const inputBase =
    "w-full rounded-xl border border-app-border bg-surface px-4 py-2.5 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors duration-base";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-fg-primary">عنوان درس *</label>
        <input
          {...register("title")}
          placeholder="مثلاً: مقدمه و معرفی دوره"
          className={cn(inputBase, errors.title && "border-red-400")}
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-status-danger">{errors.title.message}</p>
        )}
      </div>

      {/* Type selector */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-fg-primary">نوع محتوا *</label>
        <div className="flex gap-3">
          {LESSON_TYPES.map((t) => {
            const Icon = t.icon;
            const active = selectedType === t.value;
            return (
              <label
                key={t.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all",
                  active
                    ? "border-accent bg-accent-soft text-accent font-semibold"
                    : "border-app-border bg-surface text-fg-secondary hover:border-accent/40",
                )}
              >
                <input {...register("type")} type="radio" value={t.value} className="sr-only" />
                <Icon className="size-4" />
                {t.label}
              </label>
            );
          })}
        </div>
      </div>

      {/* Video source — only for video type */}
      {selectedType === "video" && (
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-fg-primary">
            منبع ویدیو
          </label>

          {/* URL vs Upload tabs */}
          <div className="mb-3 inline-flex rounded-xl border border-app-border bg-surface-subtle p-1">
            <button
              type="button"
              onClick={() => setVideoSource("url")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                videoSource === "url"
                  ? "bg-surface text-accent shadow-sm"
                  : "text-fg-secondary hover:text-fg-primary",
              )}
            >
              <Link2 className="size-3.5" />
              لینک
            </button>
            <button
              type="button"
              onClick={() => setVideoSource("upload")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                videoSource === "upload"
                  ? "bg-surface text-accent shadow-sm"
                  : "text-fg-secondary hover:text-fg-primary",
              )}
            >
              <Upload className="size-3.5" />
              آپلود فایل
            </button>
          </div>

          {videoSource === "url" ? (
            <div>
              <input
                {...register("videoUrl")}
                type="url"
                placeholder="https://www.youtube.com/watch?v=... یا https://example.com/video.mp4"
                dir="ltr"
                className={cn(inputBase, "text-left", errors.videoUrl && "border-red-400")}
                aria-invalid={!!errors.videoUrl}
              />
              <p className="mt-1 text-[0.7rem] text-fg-muted">
                YouTube، Vimeo یا لینک مستقیم mp4/webm
              </p>
            </div>
          ) : (
            <VideoUploader
              uploadedFile={uploadedFile}
              progress={uploadProgress}
              onFile={handleFileUpload}
              onClear={() => {
                setUploadedFile(null);
                setValue("videoUrl", "", { shouldValidate: true });
                setUploadProgress("idle");
              }}
            />
          )}

          {currentVideoUrl && videoSource === "url" && (
            <p className="mt-2 break-all rounded-lg bg-surface-subtle px-3 py-2 text-[0.7rem] text-fg-secondary" dir="ltr">
              {currentVideoUrl}
            </p>
          )}
        </div>
      )}

      {/* Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-fg-primary">
            مدت زمان (دقیقه) *
          </label>
          <input
            {...register("durationMinutes")}
            type="number"
            min={1}
            max={600}
            dir="ltr"
            className={cn(inputBase, "text-left", errors.durationMinutes && "border-red-400")}
            aria-invalid={!!errors.durationMinutes}
          />
          {errors.durationMinutes && (
            <p className="mt-1 text-xs text-status-danger">{errors.durationMinutes.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-fg-primary">ترتیب نمایش</label>
          <input
            {...register("sortOrder")}
            type="number"
            min={0}
            dir="ltr"
            className={cn(inputBase, "text-left")}
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-3">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            {...register("isFree")}
            className="size-4 rounded border-app-border text-accent focus:ring-accent"
          />
          <span className="text-sm text-fg-primary">درس رایگان برای پیش‌نمایش</span>
        </label>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            {...register("published")}
            className="size-4 rounded border-app-border text-accent focus:ring-accent"
          />
          <span className="text-sm text-fg-primary">منتشر شده</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          variant="brand"
          disabled={isSubmitting || uploadProgress === "uploading"}
          className="gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              در حال ذخیره...
            </>
          ) : lesson ? (
            "ذخیره تغییرات"
          ) : (
            <>
              <Plus className="size-4" />
              افزودن درس
            </>
          )}
        </Button>

        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            انصراف
          </Button>
        )}
      </div>
    </form>
  );
}

/**
 * File-input drop zone for video uploads. Streams the selected file
 * to `/api/upload` and surfaces a friendly progress / error state.
 */
function VideoUploader({
  uploadedFile,
  progress,
  onFile,
  onClear,
}: {
  uploadedFile: { name: string; size: number; url: string } | null;
  progress: "idle" | "uploading" | "done" | "error";
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  if (uploadedFile && progress === "done") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-emerald-800">
            {uploadedFile.name}
          </span>
          <span className="text-xs text-emerald-700">
            {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB · آپلود موفق
          </span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md p-1 text-emerald-700 transition-colors hover:bg-emerald-100"
          aria-label="حذف فایل"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-surface-subtle px-6 py-8 text-center transition-colors",
        progress === "uploading"
          ? "border-accent bg-accent-soft"
          : "border-app-border hover:border-accent/50 hover:bg-accent-soft/40",
      )}
    >
      {progress === "uploading" ? (
        <>
          <Loader2 className="size-8 animate-spin text-accent" />
          <span className="text-sm font-semibold text-accent">در حال آپلود...</span>
        </>
      ) : (
        <>
          <Upload className="size-8 text-fg-muted" />
          <span className="text-sm font-semibold text-fg-primary">
            فایل ویدیو را انتخاب کنید
          </span>
          <span className="text-xs text-fg-muted">mp4 یا webm · حداکثر ۸۰ مگابایت</span>
        </>
      )}
      <input
        type="file"
        accept="video/mp4,video/webm"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          // Allow re-selecting the same file
          e.target.value = "";
        }}
        disabled={progress === "uploading"}
      />
    </label>
  );
}
