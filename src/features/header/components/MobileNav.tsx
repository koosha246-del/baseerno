"use client";

import { useState, useCallback } from "react";
import { Menu, Phone, ArrowLeft, GraduationCap } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { headerData, headerPhone } from "../constants";
import { Logo } from "./Logo";

interface MobileNavProps {
  className?: string;
}

/**
 * MobileNav — slide-over drawer for the mobile header.
 *
 * Accessibility & Keyboard Navigation:
 *  - Focus trap: Tab cycling is contained within the drawer when open.
 *  - Escape closes the drawer (handled by Sheet component).
 *  - First focusable element auto-focuses on open.
 *  - Closes on link click for seamless navigation.
 *
 * Opens from the start (right) edge in RTL. Closes on link click.
 */
export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { nav, cta } = headerData;
  const drawerRef = useFocusTrap(open);

  const closeNav = useCallback(() => setOpen(false), []);

  return (
    <div className={cn("md:hidden", className)}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="باز کردن منو"
            className="text-fg-primary"
          >
            <Menu className="size-6" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="start"
          className="w-[86%] max-w-sm p-0"
          ref={drawerRef}
          aria-label="منوی ناوبری"
        >
          <SheetHeader className="border-b border-app-border-subtle bg-surface px-6 pb-5 pt-6">
            <SheetTitle asChild>
              <div>
                <Logo compact />
              </div>
            </SheetTitle>
          </SheetHeader>

          <nav
            aria-label="ناوبری موبایل"
            className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6"
          >
            {nav.map((item, idx) => (
              <a
                key={item.id}
                href={item.href}
                onClick={closeNav}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold text-fg-primary transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                style={{ animation: `fade-up 0.4s ease-luxury ${idx * 0.05}s both` }}
              >
                {item.label}
                <ArrowLeft className="size-4 text-fg-muted" />
              </a>
            ))}

            <Separator className="my-4" />

            <Button asChild variant="ghost" className="justify-start">
              <a href={headerPhone.href} onClick={closeNav} dir="ltr">
                <Phone className="size-4" />
                <span>{headerPhone.display}</span>
              </a>
            </Button>

            <Button
              asChild
              variant="brand"
              size="lg"
              className="mt-2 shadow-glow"
            >
              <a href={cta.href} onClick={closeNav}>
                <GraduationCap className="size-5" />
                {cta.label}
              </a>
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
