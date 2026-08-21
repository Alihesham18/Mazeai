import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async ({ locale }: { locale: "en" | "ar" }) => {
    const messages = locale === "ar" ? ar : en;

    return (key: string) => {
      const value = key.split(".").reduce<unknown>((current, part) => {
        if (typeof current !== "object" || current === null) return undefined;
        return (current as Record<string, unknown>)[part];
      }, messages);

      return typeof value === "string" ? value : key;
    };
  })
}));

import { Footer } from "@/components/layout/Footer/Footer";

describe("Footer", () => {
  it("renders verified contact data and the four localized route groups", async () => {
    render(await Footer({ locale: "en" }));

    const navigation = screen.getByRole("navigation", { name: en.footer.navigationLabel });
    const navigationLinks = within(navigation).getAllByRole("link");

    expect(within(navigation).getByRole("heading", { name: en.footer.company })).toBeInTheDocument();
    expect(within(navigation).getByRole("heading", { name: en.footer.solutions })).toBeInTheDocument();
    expect(within(navigation).getByRole("heading", { name: en.footer.resources })).toBeInTheDocument();
    expect(within(navigation).getByRole("heading", { name: en.footer.legal })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: en.navigation.companyOverview })).toHaveAttribute(
      "href",
      "/en/about"
    );
    expect(within(navigation).getByRole("link", { name: en.navigation.caseStudies })).toHaveAttribute(
      "href",
      "/en/case-studies"
    );
    expect(within(navigation).getByRole("link", { name: en.pages.privacy.title })).toHaveAttribute(
      "href",
      "/en/privacy"
    );
    expect(navigationLinks.every((link) => Boolean(link.textContent?.trim()))).toBe(true);

    expect(screen.getByRole("link", { name: "info@synergymazeai.com" })).toHaveAttribute(
      "href",
      "mailto:info@synergymazeai.com"
    );
    expect(screen.getByRole("link", { name: en.navigation.partner })).toHaveAttribute(
      "href",
      "/en/contact"
    );
    expect(screen.queryByText(/LinkedIn|YouTube/)).not.toBeInTheDocument();
  });

  it("uses real buttons for the compact mobile navigation disclosure", async () => {
    render(await Footer({ locale: "en" }));

    const mobileNavigation = screen.getByRole("navigation", {
      name: en.footer.mobileNavigationLabel
    });
    const companyToggle = within(mobileNavigation).getByRole("button", {
      name: en.footer.company
    });

    expect(companyToggle).toHaveAttribute("aria-expanded", "false");
    expect(within(mobileNavigation).queryByRole("link", { name: en.navigation.team })).toBeNull();

    fireEvent.click(companyToggle);

    expect(companyToggle).toHaveAttribute("aria-expanded", "true");
    expect(within(mobileNavigation).getByRole("link", { name: en.navigation.team })).toHaveAttribute(
      "href",
      "/en/about/team"
    );
  });

  it("renders Arabic labels and locale-safe routes inside an RTL context", async () => {
    const view = render(<div dir="rtl">{await Footer({ locale: "ar" })}</div>);

    expect(view.container.firstElementChild).toHaveAttribute("dir", "rtl");
    const navigation = screen.getByRole("navigation", { name: ar.footer.navigationLabel });
    expect(within(navigation).getByRole("heading", { name: ar.footer.company })).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: ar.navigation.events })).toHaveAttribute(
      "href",
      "/ar/events"
    );
    expect(screen.getByRole("link", { name: ar.navigation.partner })).toHaveAttribute(
      "href",
      "/ar/contact"
    );
  });
});
