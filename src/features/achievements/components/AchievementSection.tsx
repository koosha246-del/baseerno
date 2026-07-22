import { Container } from "@/components/shared/Container";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { GradientText } from "@/components/shared/GradientText";
import { StatCard } from "./StatCard";
import { achievementStats } from "../constants";

/**
 * AchievementSection — section #3.
 *
 * Headline metric band proving social proof. Four tinted stat cards in a
 * responsive grid, revealed with a stagger as the section enters view.
 */
export function AchievementSection() {
  return (
    <section id="achievements" className="section-padding bg-surface-muted">
      <Container width="page">
        <ScrollReveal className="mb-10 flex flex-col items-center gap-3 text-center">
          <span className="text-sm font-bold text-accent">پیشرفت ما</span>
          <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-fg-primary sm:text-4xl">
            با هم <GradientText>انگلیسی</GradientText> یاد می‌گیریم
          </h2>
          <p className="max-w-2xl text-base leading-loose text-fg-secondary">
            هزاران دانش‌آموز با درس‌های ساده بصیر نو انگلیسی را شروع کرده‌اند.
            این عددها نشان می‌دهد که تنهایی نیستی.
          </p>
        </ScrollReveal>

        <ScrollReveal
          stagger
          staggerAmount={0.12}
          className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
        >
          {achievementStats.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </ScrollReveal>
      </Container>
    </section>
  );
}
