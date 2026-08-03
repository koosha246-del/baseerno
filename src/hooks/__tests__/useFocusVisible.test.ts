import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFocusVisible } from "../useFocusVisible";

describe("useFocusVisible", () => {
  it("starts as false (mouse mode)", () => {
    const { result } = renderHook(() => useFocusVisible());
    expect(result.current).toBe(false);
  });

  it("becomes true on Tab key press", () => {
    const { result } = renderHook(() => useFocusVisible());
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    });
    expect(result.current).toBe(true);
  });

  it("becomes true on Arrow key press", () => {
    const { result } = renderHook(() => useFocusVisible());
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    });
    expect(result.current).toBe(true);
  });

  it("returns to false on mouse click", () => {
    const { result } = renderHook(() => useFocusVisible());
    // First, set keyboard mode
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    });
    expect(result.current).toBe(true);
    // Then click mouse
    act(() => {
      document.dispatchEvent(new MouseEvent("mousedown"));
    });
    expect(result.current).toBe(false);
  });

  it("ignores non-navigation keys", () => {
    const { result } = renderHook(() => useFocusVisible());
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    });
    expect(result.current).toBe(false);
  });
});
