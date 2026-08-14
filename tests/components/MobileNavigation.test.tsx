import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { MobileNavigation } from "@/components/navigation/MobileNavigation";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en"
}));

vi.mock("@/lib/auth/actions", () => ({
  logoutAction: vi.fn()
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

  it("links authenticated users to dedicated account pages", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
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
          <MobileNavigation
            locale="en"
            profile={{
              id: "user-1",
              email: "user@example.com",
              firstName: "Ali",
              lastName: "User",
              fullName: "Ali User",
              telephone: ""
            }}
          />
        </ThemeProvider>
      </NextIntlClientProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(screen.getByRole("link", { name: "Training Applications" })).toHaveAttribute(
      "href",
      "/en/account/training-applications"
    );
    expect(screen.getByRole("link", { name: "Scholarship Exams" })).toHaveAttribute(
      "href",
      "/en/account/scholarship-exams"
    );
    consoleError.mockRestore();
  });
});
