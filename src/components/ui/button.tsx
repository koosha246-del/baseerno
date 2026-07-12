import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — token-driven variant system.
 * The `brand` variant uses the signature 4-stop gradient as its surface,
 * paired with a colored glow shadow for the premium CTA look.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        brand:
          "bg-accent text-white shadow-sm hover:bg-accent-hover",
        solid:
          "bg-accent text-white shadow-sm hover:bg-accent-hover",
        soft: "bg-accent-soft text-accent hover:bg-accent-softHover",
        outline:
          "border border-app-border bg-surface text-fg-primary hover:bg-surface-subtle hover:border-app-border-strong",
        ghost: "text-fg-primary hover:bg-surface-subtle",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
