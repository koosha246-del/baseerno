import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Mail, Loader2, ArrowLeft, Sparkles } from "lucide-react";

/**
 * بصیر نو Button — token-driven variant system.
 * Variants: `brand` (gradient CTA), `solid` (filled), `soft` (tinted),
 * `outline` (bordered), `ghost` (no surface), `link` (inline).
 */
const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["brand", "solid", "soft", "outline", "ghost", "link"],
      description: "Visual variant of the button",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon"],
      description: "Button size",
    },
    disabled: { control: "boolean" },
    asChild: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: "ثبت‌نام در دوره", variant: "brand", size: "md" },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">کوچک</Button>
      <Button size="md">متوسط</Button>
      <Button size="lg">بزرگ</Button>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      <Button variant="brand">برند (Brand)</Button>
      <Button variant="solid">سالید (Solid)</Button>
      <Button variant="soft">سافت (Soft)</Button>
      <Button variant="outline">اوت‌لاین (Outline)</Button>
      <Button variant="ghost">گوست (Ghost)</Button>
      <Button variant="link">لینک (Link)</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="brand">
        <Sparkles />
        شروع یادگیری
      </Button>
      <Button variant="soft">
        <Mail />
        ارسال پیام
      </Button>
      <Button variant="outline">
        بازگشت
        <ArrowLeft />
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex gap-3">
      <Button disabled>
        <Loader2 className="animate-spin" />
        در حال پردازش
      </Button>
      <Button variant="soft" disabled>
        <Loader2 className="animate-spin" />
        صبر کنید
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { children: "غیرفعال", disabled: true, variant: "brand" },
};

export const AsChild: Story = {
  render: () => (
    <Button asChild variant="brand">
      <a href="#example">لینک به‌صورت دکمه</a>
    </Button>
  ),
};
