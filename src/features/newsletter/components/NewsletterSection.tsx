"use client";

import { useState } from "react";
import { Container } from "@/components/shared/Container";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { Mail, CheckCircle } from "lucide-react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  }

  return (
    <section className="section-padding bg-brand-gradient">
      <Container width="narrow">
        <ScrollReveal>
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-white/20">
              <Mail className="size-8 text-white" />
            </div>
            <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
              درس‌های جدید را از دست نده
            </h2>
            <p className="max-w-xl text-lg text-white/80">
              ایمیل بگذار تا از درس‌های تازه و تمرین‌های شاد انگلیسی باخبر شوی.
            </p>

            {submitted ? (
              <div className="flex items-center gap-3 rounded-xl bg-white/20 px-6 py-4">
                <CheckCircle className="size-6 text-white" />
                <span className="font-bold text-white">عالی! ثبت شد.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ایمیل تو"
                  required
                  className="flex-1 rounded-lg border-0 bg-white/20 px-4 py-3 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-accent hover:bg-white/90"
                >
                  خبرم کن
                </button>
              </form>
            )}
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
