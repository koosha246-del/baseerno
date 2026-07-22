"use client";

import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { Award, BookOpen, Users } from "lucide-react";

const instructors = [
  {
    id: "i1",
    name: "خانم سارا محمدی",
    title: "معلم انگلیسی کودکان و نوجوانان",
    bio: "سال‌هاست به دانش‌آموزان کمک می‌کند انگلیسی را با آرامش و بازی یاد بگیرند.",
    initial: "س",
    stats: { courses: 4, students: 5400, rating: 4.9 },
  },
  {
    id: "i2",
    name: "آقای رضا کریمی",
    title: "معلم مکالمه و گرامر",
    bio: "درس‌هایش کوتاه و واضح است تا هیچ‌کس گیج نشود و جلو برود.",
    initial: "ر",
    stats: { courses: 3, students: 3200, rating: 4.8 },
  },
];

export function InstructorsSection() {
  return (
    <section className="section-padding bg-surface-subtle">
      <SectionHeading
        eyebrow="معلم‌های ما"
        title="با معلم‌های مهربان یاد بگیر"
        description="کسانی که بلدند برای دانش‌آموز ساده توضیح بدهند"
      />

      <Container width="page" className="mt-10">
        <ScrollReveal stagger staggerAmount={0.2} className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {instructors.map((instructor) => (
            <div
              key={instructor.id}
              className="flex flex-col gap-5 rounded-xl border border-app-border bg-surface p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-2xl font-bold text-white">
                  {instructor.initial}
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-xl font-bold text-fg-primary">
                    {instructor.name}
                  </h3>
                  <span className="text-sm text-accent">{instructor.title}</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-fg-secondary">{instructor.bio}</p>
              <div className="flex items-center gap-6 border-t border-app-border-subtle pt-4">
                <div className="flex items-center gap-2 text-sm text-fg-muted">
                  <BookOpen className="size-4" />
                  <span>{instructor.stats.courses} درس</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-fg-muted">
                  <Users className="size-4" />
                  <span>{instructor.stats.students}+ دانش‌آموز</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-fg-muted">
                  <Award className="size-4" />
                  <span>{instructor.stats.rating} امتیاز</span>
                </div>
              </div>
            </div>
          ))}
        </ScrollReveal>
      </Container>
    </section>
  );
}
