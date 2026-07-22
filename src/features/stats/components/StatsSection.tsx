"use client";

import { Container } from "@/components/shared/Container";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { StatCounter } from "@/components/shared/StatCounter";

const stats = [
  { id: "st1", value: 5400, suffix: "+", label: "دانش‌آموز" },
  { id: "st2", value: 12, suffix: "", label: "درس فعال" },
  { id: "st3", value: 98, suffix: "%", label: "رضایت از درس" },
  { id: "st4", value: 50, suffix: "+", label: "مدرسه همکار" },
];

export function StatsSection() {
  return (
    <section className="section-padding bg-background">
      <Container width="page">
        <ScrollReveal stagger staggerAmount={0.1} className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.id} className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-baseline gap-1">
                <StatCounter value={stat.value} className="font-display text-4xl font-extrabold text-accent sm:text-5xl" />
                {stat.suffix ? (
                  <span className="text-2xl font-bold text-accent">{stat.suffix}</span>
                ) : null}
              </div>
              <span className="text-sm font-medium text-fg-secondary">{stat.label}</span>
            </div>
          ))}
        </ScrollReveal>
      </Container>
    </section>
  );
}
