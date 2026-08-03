import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "./separator";

/**
 * Separator — thin horizontal or vertical divider.
 * Use to break up sections without adding visual weight.
 */
const meta: Meta<typeof Separator> = {
  title: "Components/Separator",
  component: Separator,
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-64 space-y-3">
      <p className="text-sm text-fg-primary">بخش اول</p>
      <Separator />
      <p className="text-sm text-fg-primary">بخش دوم</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-3 text-sm text-fg-primary">
      <span>خانه</span>
      <Separator orientation="vertical" />
      <span>دوره‌ها</span>
      <Separator orientation="vertical" />
      <span>درباره ما</span>
    </div>
  ),
};
