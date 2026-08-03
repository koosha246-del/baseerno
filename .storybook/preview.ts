import type { Preview } from "@storybook/react";
import { withThemeByClassName } from "@storybook/addon-themes";
import "../src/app/globals.css";

/**
 * Storybook preview config — wires global CSS, decorator order, and the
 * light/dark theme toolbar so every story can be previewed in both modes.
 */
const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true,
    },
    options: {
      storySort: {
        order: [
          "Foundations",
          "Components",
          "Features",
          "*",
        ],
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ],
  globalTypes: {
    locale: {
      name: "Locale",
      description: "Switch UI language for sample text",
      defaultValue: "fa",
      toolbar: {
        icon: "globe",
        items: [
          { value: "fa", title: "فارسی (RTL)" },
          { value: "en", title: "English (LTR)" },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
