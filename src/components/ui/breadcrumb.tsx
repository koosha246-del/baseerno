"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Breadcrumb — semantic nav trail for page hierarchy.
 *
 * Renders as nav > ol > li[aria-current="page"], fully
 * RTL-aware (chevron mirrors direction). Follows the same
 * shadcn/ui pattern as accordion, button, card, etc.
 *
 * --- Atomic exports ---
 *
 *  <Breadcrumb>
 *    <BreadcrumbList>
 *      <BreadcrumbItem>
 *        <BreadcrumbLink href="/courses">دوره‌ها</BreadcrumbLink>
 *      </BreadcrumbItem>
 *      <BreadcrumbSeparator />
 *      <BreadcrumbItem>
 *        <BreadcrumbPage>دوره گرامر</BreadcrumbPage>
 *      </BreadcrumbItem>
 *    </BreadcrumbList>
 *  </Breadcrumb>
 */

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    /** Accessible label — defaults to "مسیر راهنما" */
    "aria-label"?: string;
  }
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    aria-label="مسیر راهنما"
    className={cn("", className)}
    {...props}
  />
));
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 text-sm text-fg-secondary",
      className
    )}
    {...props}
  />
));
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    /** When true, renders as plain span (non-interactive) */
    asChild?: boolean;
  }
>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? "span" : "a";
  return (
    <Comp
      ref={ref}
      className={cn(
        "transition-colors duration-base hover:text-accent",
        !asChild && "font-medium",
        className
      )}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = "BreadcrumbLink";

/**
 * BreadcrumbPage — the current page label (non-interactive).
 * Renders with `aria-current="page"` and a bolder weight.
 */
const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    aria-current="page"
    className={cn("font-semibold text-fg-primary", className)}
    {...props}
  />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

/**
 * BreadcrumbSeparator — visual divider between items.
 *
 * In RTL mode the chevron automatically points the correct
 * direction (ChevronLeft for RTL, ChevronRight for LTR).
 */
const BreadcrumbSeparator = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => {
  const dir = typeof document !== "undefined"
    ? document.documentElement.dir
    : "rtl";
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <li
      ref={ref}
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-4", className)}
      {...props}
    >
      <Chevron className="text-fg-muted/60" />
    </li>
  );
});
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
