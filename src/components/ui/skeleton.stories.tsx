import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./skeleton";

/**
 * Skeleton — loading placeholder with brand shimmer.
 * Use for content placeholders while async data loads.
 */
const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Basic: Story = {
  args: { className: "h-4 w-48" },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-10 w-32 rounded-lg" />
      <Skeleton className="size-12 rounded-full" />
    </div>
  ),
};

export const CardSkeleton: Story = {
  render: () => (
    <div className="w-80 space-y-3 rounded-2xl border border-app-border p-6">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  ),
};
