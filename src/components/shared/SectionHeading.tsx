import { cn } from "@/lib/utils";
import { Container } from "@/components/shared/Container";
import { GradientText } from "@/components/shared/GradientText";

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "start";
  width?: "page" | "narrow";
  className?: string;
  /** Renders the heading inside a ScrollReveal-ready stagger block. */
  id?: string;
}

/**
 * SectionHeading — reusable eyebrow + title + description block.
 * Provides the consistent section rhythm across all homepage sections.
 * Title supports gradient spans via the <GradientText> component.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  width = "narrow",
  className,
  id,
}: SectionHeadingProps) {
  return (
    <Container width={width}>
      <div
        className={cn(
          "flex flex-col gap-4",
          align === "center" ? "items-center text-center" : "items-start text-right",
          className
        )}
      >
        {eyebrow ? (
          <span
            className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-1.5 text-xs font-bold text-accent"
          >
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
            {eyebrow}
          </span>
        ) : null}

        <h2
          id={id}
          className="font-display text-3xl font-extrabold leading-tight tracking-tight text-fg-primary sm:text-4xl lg:text-[2.75rem]"
        >
          {title}
        </h2>

        {description ? (
          <p className="max-w-2xl animate-fade-up text-base leading-loose text-fg-secondary sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
    </Container>
  );
}

export { GradientText };
