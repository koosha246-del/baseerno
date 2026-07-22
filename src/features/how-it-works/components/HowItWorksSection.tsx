"use client";

import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { BookOpen, Video, Award, Headphones } from "lucide-react";

const steps = [
  {
    id: "s1",
    icon: BookOpen,
    title: "یک درس انتخاب کن",
    description: "درس انگلیسی مناسب سطح خودت را پیدا کن.",
  },
  {
    id: "s2",
    icon: Video,
    title: "ویدیو ببین و تمرین کن",
    description: "درس‌های کوتاه را ببین و تمرین‌های آسان را انجام بده.",
  },
  {
    id: "s3",
    icon: Headphones,
    title: "سوال بپرس",
    description: "اگر چیزی سخت بود، از معلم کمک بگیر.",
  },
  {
    id: "s4",
    icon: Award,
    title: "گواهی بگیر",
    description: "بعد از تمام کردن درس، گواهی پایان را دریافت کن.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="section-padding bg-background">
      <SectionHeading
        eyebrow="شروع آسان"
        title="چطور انگلیسی یاد بگیرم؟"
        description="فقط ۴ قدم ساده — بدون گیج شدن"
      />

      <Container width="page" className="mt-10">
        <ScrollReveal stagger staggerAmount={0.15} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="relative flex flex-col items-center gap-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-accent-soft">
                  <Icon className="size-8 text-accent" />
                </div>
                <span className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="font-display text-lg font-bold text-fg-primary">{step.title}</h3>
                <p className="text-sm leading-relaxed text-fg-secondary">{step.description}</p>
              </div>
            );
          })}
        </ScrollReveal>
      </Container>
    </section>
  );
}
