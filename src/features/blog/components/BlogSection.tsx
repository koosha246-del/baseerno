"use client";

import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Calendar } from "lucide-react";

const articles = [
  {
    id: "a1",
    title: "۵ راه ساده برای یاد گرفتن واژه‌های جدید",
    excerpt: "با بازی و تکرار کوتاه، کلمات انگلیسی را بهتر به خاطر بسپار.",
    category: "واژگان",
    readTime: "۵ دقیقه",
    date: "۱۵ آذر ۱۴۰۳",
    slug: "new-words",
  },
  {
    id: "a2",
    title: "چطور هر روز ۱۰ دقیقه انگلیسی تمرین کنیم؟",
    excerpt: "یک برنامه خیلی کوتاه برای خانه — بدون خستگی و بدون استرس.",
    category: "تمرین",
    readTime: "۶ دقیقه",
    date: "۱۰ آذر ۱۴۰۳",
    slug: "daily-practice",
  },
  {
    id: "a3",
    title: "شنیدن انگلیسی بدون ترس",
    excerpt: "از کجا شروع کنی و چطور کم‌کم گوش دادن را قوی کنی.",
    category: "شنیدن",
    readTime: "۵ دقیقه",
    date: "۵ آذر ۱۴۰۳",
    slug: "listening-easy",
  },
];

export function BlogSection() {
  return (
    <section className="section-padding bg-background">
      <SectionHeading
        eyebrow="نکته‌های یادگیری"
        title="نکته‌های ساده برای انگلیسی"
        description="راهنماهای کوتاه تا راحت‌تر یاد بگیری"
      />

      <Container width="page" className="mt-10">
        <ScrollReveal stagger staggerAmount={0.1} className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.id}
              className="group flex flex-col gap-4 rounded-xl border border-app-border bg-surface p-6 transition-all hover:shadow-md"
            >
              <span className="w-fit rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
                {article.category}
              </span>
              <h3 className="font-display text-lg font-bold text-fg-primary group-hover:text-accent transition-colors">
                {article.title}
              </h3>
              <p className="text-sm leading-relaxed text-fg-secondary">{article.excerpt}</p>
              <div className="mt-auto flex items-center gap-4 border-t border-app-border-subtle pt-4 text-xs text-fg-muted">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {article.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {article.readTime}
                </span>
              </div>
            </article>
          ))}
        </ScrollReveal>

        <div className="mt-10 flex justify-center">
          <Button asChild variant="outline" size="lg" className="group/btn">
            <a href="/blog">
              همه نکته‌ها
              <ArrowLeft className="size-4 transition-transform group-hover/btn:-translate-x-1" />
            </a>
          </Button>
        </div>
      </Container>
    </section>
  );
}
