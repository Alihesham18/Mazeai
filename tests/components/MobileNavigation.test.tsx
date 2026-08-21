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

    const trigger = screen.getByRole("button", { name: "Open navigation menu" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Partner With Us" })).toHaveAttribute(
      "href",
      "/en/contact"
    );
    expect(document.body.dataset.menuOpen).toBe("true");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.dataset.menuOpen).toBe("false");
    expect(trigger).toHaveFocus();
  });

  it("marks the active route and keeps keyboard focus inside the open dialog", () => {
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
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");

    const close = screen.getByRole("button", { name: "Close navigation menu" });
    expect(close).toHaveFocus();
    screen.getByRole("link", { name: "SynergyMazeAI" }).focus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(screen.getByRole("link", { name: "Partner With Us" })).toHaveFocus();
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

  it("keeps the mobile Services group focused on the three ready services", () => {
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
    const servicesSummary = screen.getByText("Services", { selector: "summary" });
    fireEvent.click(servicesSummary);

    expect(screen.getByRole("link", { name: "Services Overview" })).toHaveAttribute(
      "href",
      "/en/services"
    );
    expect(screen.getByRole("link", { name: "Web Development" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Web Design" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "AI Consulting" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "AI Solutions and Automation" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Custom Programs" })).toBeNull();
  });
});
