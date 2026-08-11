import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { MobileNavigation } from "@/components/navigation/MobileNavigation";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en"
}));

describe("MobileNavigation", () => {
  it("opens and closes the accessible mobile menu", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
    );

    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ThemeProvider>
          <MobileNavigation locale="en" />
        </ThemeProvider>
      </NextIntlClientProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.body.dataset.menuOpen).toBe("true");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.dataset.menuOpen).toBe("false");
  });
});
