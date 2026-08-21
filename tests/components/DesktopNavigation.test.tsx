import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { DesktopNavigation } from "@/components/navigation/DesktopNavigation";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/research/projects"
}));

describe("DesktopNavigation", () => {
  it("preserves public routes, marks the active group, and exposes its submenu", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <DesktopNavigation locale="en" />
      </NextIntlClientProvider>
    );

    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/en");
    expect(screen.getByRole("link", { name: "Training" })).toHaveAttribute("href", "/en/training");
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/en/contact");

    const research = screen.getByRole("button", { name: "R&D" });
    expect(research.className).toContain("current");
    expect(research).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(research);
    expect(research).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Current Projects" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("shows only the three ready services and the Services overview", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <DesktopNavigation locale="en" />
      </NextIntlClientProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Services" }));

    expect(screen.getByRole("link", { name: "Services Overview" })).toHaveAttribute(
      "href",
      "/en/services"
    );
    expect(screen.getByRole("link", { name: "Web Development" })).toHaveAttribute(
      "href",
      "/en/services/web-development"
    );
    expect(screen.getByRole("link", { name: "Web Design" })).toHaveAttribute(
      "href",
      "/en/services/web-design"
    );
    expect(screen.getByRole("link", { name: "AI Consulting" })).toHaveAttribute(
      "href",
      "/en/services/ai-consulting"
    );
    expect(screen.queryByRole("link", { name: "AI Solutions and Automation" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Research and Development" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Education and Training" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Academic Partnerships" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Custom Programs" })).toBeNull();
  });
});
