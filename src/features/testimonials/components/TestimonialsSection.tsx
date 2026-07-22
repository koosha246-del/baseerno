"use client";

import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { RatingStars } from "@/components/shared/RatingStars";
import { Quote } from "lucide-react";

const testimonials = [
  {
    id: "t1",
    name: "مریم احمدی",
    role: "دانش‌آموز — انگلیسی از صفر",
    avatar: "م",
    rating: 5,
    text: "اول می‌ترسیدم. حالا می‌تونم جمله‌های ساده انگلیسی بگم. درس‌ها کوتاه و قشنگن.",
  },
  {
    id: "t2",
    name: "علی کریمی",
    role: "دانش‌آموز — گرامر آسان",
    avatar: "ع",
    rating: 5,
    text: "گرامر برام سخت بود. اینجا با مثال‌های کوتاه فهمیدم و دیگه گیج نمی‌شم.",
  },
  {
    id: "t3",
    name: "زهرا محمدی",
    role: "دانش‌آموز — شنیدن و تلفظ",
    avatar: "ز",
    rating: 5,
    text: "تلفظم بهتر شده. تو کلاس مدرسه هم بیشتر دست بلند می‌کنم.",
  },
  {
    id: "t4",
    name: "رضا نوری",
    role: "والد دانش‌آموز",
    avatar: "ر",
    rating: 5,
    text: "پسرم با علاقه درس‌ها رو می‌بینه. زبان سایت ساده است و بچه سردرگم نمی‌شه.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="section-padding bg-surface-subtle">
      <SectionHeading
        eyebrow="نظر دانش‌آموزان"
        title="بچه‌ها چه می‌گویند؟"
        description="هزاران دانش‌آموز با ما انگلیسی یاد می‌گیرند"
      />

      <Container width="page" className="mt-10">
        <ScrollReveal stagger staggerAmount={0.1} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="flex flex-col gap-4 rounded-xl border border-app-border bg-surface p-6"
            >
              <Quote className="size-8 text-accent/30" />
              <p className="text-base leading-loose text-fg-secondary">{t.text}</p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                  {t.avatar}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-fg-primary">{t.name}</span>
                  <span className="text-xs text-fg-muted">{t.role}</span>
                </div>
                <div className="mr-auto">
                  <RatingStars value={t.rating} count={1} size={14} />
                </div>
              </div>
            </div>
          ))}
        </ScrollReveal>
      </Container>
    </section>
  );
}
