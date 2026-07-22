"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ShoppingBag, Download, Loader2, CheckCircle2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buyBook } from "./actions";
import type { Book } from "@/lib/library";
import { formatToman } from "@/lib/library";

interface Props {
  books: Book[];
}

export function LibraryClient({ books }: Props) {
  // Per-book purchase state: the download token once payment "succeeds".
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleBuy(book: Book) {
    setError(null);
    startTransition(async () => {
      const result = await buyBook(book.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTokens((prev) => ({ ...prev, [book.id]: result.token }));
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-col items-start gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
          <BookOpen className="size-3.5" />
          کتابخانه دیجیتال
        </span>
        <h1 className="font-display text-3xl font-extrabold text-fg-primary sm:text-4xl">
          کتاب‌های تدریس‌شده در آکادمی
        </h1>
        <p className="max-w-2xl text-base leading-loose text-fg-secondary">
          منابع اصلی دوره‌های زبان انگلیسی. برای دانلود، پرداخت را تکمیل کنید
          تا لینک دانلود فعال شود.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => {
          const token = tokens[book.id];
          const isPending = pending && !token;
          return (
            <article
              key={book.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-app-border-subtle bg-surface shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-blue-50 to-amber-50">
                <Image
                  src={book.cover}
                  alt={book.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.65rem] font-bold text-fg-primary shadow">
                  {book.level}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-fg-primary">
                    {book.title}
                  </h2>
                  {book.subtitle && (
                    <p className="mt-0.5 text-xs text-fg-secondary">{book.subtitle}</p>
                  )}
                  <p className="mt-1 text-xs text-fg-secondary">نویسنده: {book.author}</p>
                </div>

                <p className="line-clamp-3 text-sm leading-loose text-fg-secondary">
                  {book.description}
                </p>

                {book.pages && (
                  <p className="text-[0.7rem] text-fg-secondary">
                    {book.pages} صفحه
                  </p>
                )}

                <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                  <div>
                    <p className="text-[0.7rem] text-fg-secondary">قیمت</p>
                    <p className="font-display text-lg font-extrabold text-fg-primary">
                      {formatToman(book.price)}
                    </p>
                  </div>

                  {token ? (
                    <Button asChild variant="brand" size="sm" className="shadow-glow">
                      <a
                        href={`/api/library/${book.id}/download?token=${encodeURIComponent(token)}`}
                        download
                      >
                        <Download className="size-4" />
                        دانلود
                      </a>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleBuy(book)}
                      disabled={isPending}
                      variant="brand"
                      size="sm"
                      className="shadow-glow"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          در حال پرداخت
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="size-4" />
                          خرید و دانلود
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {token && (
                  <p className="flex items-center gap-1.5 text-[0.7rem] font-medium text-emerald-600">
                    <CheckCircle2 className="size-3.5" />
                    پرداخت موفق — لینک دانلود فعال شد
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
