import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { THEME_STORAGE_KEY } from "@/components/theme/theme-config";

describe("ThemeProvider", () => {
  const matchMedia = vi.fn<(query: string) => MediaQueryList>();

  function setSystemTheme(theme: "light" | "dark") {
    matchMedia.mockImplementation(
      (query) =>
        ({
          matches: query === "(prefers-color-scheme: light)" && theme === "light",
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn()
        }) as unknown as MediaQueryList
    );
  }

  function renderThemeToggle() {
    return render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
  }

  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "dark";
    matchMedia.mockReset();
    setSystemTheme("dark");
    vi.stubGlobal("matchMedia", matchMedia);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("applies a persisted light preference over a dark system preference", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    renderThemeToggle();

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "Toggle color theme" })).toBeInTheDocument();
  });

  it("applies a persisted dark preference over a light system preference", () => {
    setSystemTheme("light");
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");

    renderThemeToggle();

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it.each([
    ["light", true],
    ["dark", false]
  ] as const)("falls back to the %s system preference without a saved preference", (theme, prefersLight) => {
    setSystemTheme(prefersLight ? "light" : "dark");

    renderThemeToggle();

    expect(document.documentElement).toHaveAttribute("data-theme", theme);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("toggles in both directions and persists the global document theme", () => {
    renderThemeToggle();

    const toggle = screen.getByRole("button", { name: "Toggle color theme" });

    fireEvent.click(toggle);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");

    fireEvent.click(toggle);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("restores the persisted preference after a remount", () => {
    const firstRender = renderThemeToggle();

    fireEvent.click(screen.getByRole("button", { name: "Toggle color theme" }));
    firstRender.unmount();
    document.documentElement.dataset.theme = "dark";

    renderThemeToggle();

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("synchronizes theme changes from another browser tab", () => {
    renderThemeToggle();
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    fireEvent(
      window,
      new StorageEvent("storage", {
        key: THEME_STORAGE_KEY,
        newValue: "light",
        storageArea: window.localStorage
      })
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "light");

    window.localStorage.removeItem(THEME_STORAGE_KEY);
    fireEvent(
      window,
      new StorageEvent("storage", {
        key: THEME_STORAGE_KEY,
        newValue: null,
        storageArea: window.localStorage
      })
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("ignores an invalid stored value and uses the system preference", () => {
    setSystemTheme("light");
    window.localStorage.setItem(THEME_STORAGE_KEY, "sepia");

    const { container } = renderThemeToggle();

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "Toggle color theme" })).toBeInTheDocument();
    expect(container.querySelector(".lucide-sun")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".lucide-moon")).toHaveAttribute("aria-hidden", "true");
  });
});
