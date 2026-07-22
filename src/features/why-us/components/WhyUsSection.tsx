"use client";

import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { Shield, Clock, Headphones, Award, Users, Sparkles } from "lucide-react";

const reasons = [
  {
    id: "r1",
    icon: Shield,
    title: "درس‌های مطمئن",
    description: "محتوای انگلیسی برای دانش‌آموز، ساده و قابل فهم.",
  },
  {
    id: "r2",
    icon: Clock,
    title: "هر وقت بخوای",
    description: "بعد از ثبت‌نام، هر ساعتی که دوست داری درس را باز کن.",
  },
  {
    id: "r3",
    icon: Headphones,
    title: "همیشه کمک هست",
    description: "اگر گیر کردی، تیم پشتیبانی و معلم کمکت می‌کنند.",
  },
  {
    id: "r4",
    icon: Award,
    title: "گواهی پایان",
    description: "با تمام کردن درس، گواهی ساده و قابل نشان دادن می‌گیری.",
  },
  {
    id: "r5",
    icon: Users,
    title: "با بقیه یاد بگیر",
    description: "هزاران دانش‌آموز مثل تو اینجا انگلیسی تمرین می‌کنند.",
  },
  {
    id: "r6",
    icon: Sparkles,
    title: "درس‌های تازه",
    description: "محتوا به‌روز می‌شود تا همیشه مفید و شاد بماند.",
  },
];

export function WhyUsSection() {
  return (
    <section className="section-padding bg-surface-subtle">
      <SectionHeading
        eyebrow="چرا اینجا؟"
        title="چرا بصیر نو؟"
        description="ساده، آرام و مناسب دانش‌آموز"
      />

      <Container width="page" className="mt-10">
        <ScrollReveal stagger staggerAmount={0.1} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <div
                key={reason.id}
                className="flex flex-col gap-4 rounded-xl border border-app-border bg-surface p-6"
              >
                <div className="flex size-12 items-center justify-center rounded-lg bg-accent-soft">
                  <Icon className="size-6 text-accent" />
                </div>
                <h3 className="font-display text-lg font-bold text-fg-primary">{reason.title}</h3>
                <p className="text-sm leading-relaxed text-fg-secondary">{reason.description}</p>
              </div>
            );
          })}
        </ScrollReveal>
      </Container>
    </section>
  );
}
