import type { Meta, StoryObj } from "@storybook/react";
import { ThemeToggle } from "./ThemeToggle";
import { ThemeProvider } from "next-themes";

/**
 * ThemeToggle — sun/moon button that flips between light and dark themes.
 * Requires next-themes provider so useTheme() resolves correctly.
 */
const meta: Meta<typeof ThemeToggle> = {
  title: "Components/ThemeToggle",
  component: ThemeToggle,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <div className="rounded-xl border border-app-border bg-surface p-4">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

export const Light: Story = {};

export const InContext: Story = {
  render: () => (
    <div className="flex items-center gap-4 rounded-xl border border-app-border bg-surface px-4 py-3">
      <span className="text-sm text-fg-secondary">تم فعلی:</span>
      <ThemeToggle />
      <span className="text-xs text-fg-muted">
        کلیک کنید برای تغییر بین روشن و تاریک
      </span>
    </div>
  ),
};
