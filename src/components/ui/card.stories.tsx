import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";

/**
 * Card — elevated surface primitive.
 * Use for grouped content, course tiles, and dashboard widgets.
 */
const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>دوره انگلیسی</CardTitle>
        <CardDescription>سطح متوسط · ۲۴ جلسه</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body-sm text-fg-secondary">
          یادگیری گرامر و مکالمه با روش تعاملی و تمرین‌های روزانه.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="brand">مشاهده دوره</Button>
      </CardFooter>
    </Card>
  ),
};

export const Grid: Story = {
  render: () => (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>گرامر</CardTitle>
          <CardDescription>از پایه تا پیشرفته</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-fg-secondary">
            ساختارهای کلیدی زبان انگلیسی با مثال‌های واقعی.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>مکالمه</CardTitle>
          <CardDescription>روان صحبت کن</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-fg-secondary">
            تمرین مکالمه با موضوعات روزمره و آزمون‌های شبیه‌سازی.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
};
