import { cn } from "@/lib/utils";

type Width = "page" | "narrow" | "wide";

const widthMap: Record<Width, string> = {
  page: "max-w-page",
  narrow: "max-w-narrow",
  wide: "max-w-wide",
};

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: Width;
  as?: React.ElementType;
}

/**
 * Container — page-width wrapper with responsive gutters.
 * Centralizes the max-width system so sections never hardcode widths.
 */
export function Container({
  width = "page",
  as: Comp = "div",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <Comp
      className={cn(
        "mx-auto w-full px-5 sm:px-6 lg:px-8",
        widthMap[width],
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
