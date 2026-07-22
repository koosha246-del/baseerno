import "@testing-library/jest-dom/vitest";
import { beforeAll, afterAll } from "vitest";

// Quiet down noisy console errors during tests (e.g. expected rejections).
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = String(args[0] ?? "");
    if (msg.includes("not wrapped in act")) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
