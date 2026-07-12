"use client";

import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { FaqItemData } from "../types";

interface FaqItemProps {
  item: FaqItemData;
}

/**
 * FaqItem — single expandable question-answer row.
 * Wraps the shadcn/ui Accordion primitive with branded styling.
 */
export function FaqItem({ item }: FaqItemProps) {
  return (
    <AccordionItem value={item.id}>
      <AccordionTrigger>{item.question}</AccordionTrigger>
      <AccordionContent>{item.answer}</AccordionContent>
    </AccordionItem>
  );
}
