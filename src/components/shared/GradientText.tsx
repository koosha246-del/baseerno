import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * GradientText — renders text with the signature brand gradient.
 * Uses the --theme-text-gradient CSS variable so the hero carousel can
 * dynamically change the headline color when rotating slides.
 * The gradient flows right-to-left (RTL-friendly) so it reads naturally
 * for Persian audiences.
 */
export function GradientText({
  children,
  className,
  as: Comp = "span",
}: GradientTextProps) {
  return (
    <Comp
      className={cn(
        "inline-block bg-clip-text text-transparent",
        className
      )}
      style={{
        backgroundImage: "var(--theme-text-gradient, linear-gradient(120deg, #1E3A5F, #2563EB, #D4A017, #F5C518))",
      }}
    >
      {children}
    </Comp>
  );
}
