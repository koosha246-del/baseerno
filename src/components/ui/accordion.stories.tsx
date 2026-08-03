import type { Meta, StoryObj } from "@storybook/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

/**
 * Accordion — Radix-powered expandable list.
 * Used for FAQ sections and collapsible content blocks.
 */
const meta: Meta<typeof Accordion> = {
  title: "Components/Accordion",
  component: Accordion,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Accordion>;

const faqItems = [
  {
    q: "چگونه می‌توانم ثبت‌نام کنم؟",
    a: "از منوی بالای صفحه روی «ثبت‌نام» کلیک کنید و فرم را با اطلاعات خود پر کنید.",
  },
  {
    q: "آیا دوره‌ها گارانتی بازگشت وجه دارند؟",
    a: "بله، تا ۷ روز پس از خرید در صورت عدم رضایت، وجه شما به‌طور کامل برگشت داده می‌شود.",
  },
  {
    q: "سطح زبان من چقدر باید باشد؟",
    a: "دوره‌ها از مبتدی تا پیشرفته طراحی شده‌اند. می‌توانید با آزمون تعیین سطح، سطح خود را پیدا کنید.",
  },
];

export const FAQ: Story = {
  render: () => (
    <div className="w-full max-w-xl">
      <Accordion type="single" collapsible className="space-y-2">
        {faqItems.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" className="w-full max-w-xl space-y-2">
      {faqItems.map((item, i) => (
        <AccordionItem key={i} value={`item-${i}`}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent>{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
};
