import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { THEME_STORAGE_KEY } from "@/components/theme/theme-config";

describe("ThemeProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "dark";
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("applies the persisted theme to the global document source", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "Toggle color theme" })).toBeInTheDocument();
  });

  it("toggles and persists the global document theme", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Toggle color theme" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(screen.getByRole("button", { name: "Toggle color theme" })).toBeInTheDocument();
  });
});
