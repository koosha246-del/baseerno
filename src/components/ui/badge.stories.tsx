import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./badge";

/**
 * Badge — compact status / category pill.
 * Use for tags, level indicators, and free/paid markers.
 */
const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "brand", "outline", "muted", "success"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default">پیش‌فرض</Badge>
      <Badge variant="brand">برند</Badge>
      <Badge variant="outline">اوت‌لاین</Badge>
      <Badge variant="muted">خاموش</Badge>
      <Badge variant="success">موفقیت</Badge>
    </div>
  ),
};

export const CourseLevels: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge variant="success">مبتدی</Badge>
      <Badge variant="default">متوسط</Badge>
      <Badge variant="brand">پیشرفته</Badge>
      <Badge variant="outline">IELTS 7+</Badge>
    </div>
  ),
};
