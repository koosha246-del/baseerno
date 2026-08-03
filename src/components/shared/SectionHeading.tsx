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
  id?: string;
}

/**
 * SectionHeading — reusable eyebrow + title + description.
 * A thin hairline accent line appears on the right
 * as the subtle signature element.
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
          "relative flex flex-col gap-3",
          align === "center" ? "items-center text-center" : "items-start text-right",
          // Hairline accent — subtle signature element on the right side
          align === "start" && "pr-5",
          className
        )}
      >
        {align === "start" && (
          <div
            className="absolute right-0 top-2 bottom-2 w-px"
            style={{ background: "var(--theme-accent)" }}
            aria-hidden
          />
        )}

        {eyebrow ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
            {eyebrow}
          </span>
        ) : null}

        <h2
          id={id}
          className="font-display text-2xl font-extrabold leading-tight tracking-tight text-fg-primary sm:text-3xl lg:text-[2.5rem]"
        >
          {title}
        </h2>

        {description ? (
          <p className="max-w-2xl text-base leading-relaxed text-fg-secondary sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
    </Container>
  );
}

export { GradientText };
