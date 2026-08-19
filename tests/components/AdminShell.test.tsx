import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import arMessages from "@/../messages/ar.json";
import enMessages from "@/../messages/en.json";
import faMessages from "@/../messages/fa.json";
import trMessages from "@/../messages/tr.json";
import { AdminShell } from "@/components/admin/AdminShell";
import type { Locale } from "@/i18n/routing";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname }));

const messagesByLocale = {
  en: enMessages,
  tr: trMessages,
  ar: arMessages,
  fa: faMessages
};

const identity = {
  email: "admin@example.com",
  firstName: "Maze",
  lastName: "Admin"
};

function renderShell(locale: Locale = "en") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      <AdminShell identity={identity} locale={locale}>
        <p>admin-content</p>
      </AdminShell>
    </NextIntlClientProvider>
  );
}

describe("AdminShell", () => {
  beforeEach(() => {
    usePathname.mockReset().mockReturnValue("/en/admin");
  });

  it("renders the centralized navigation, identity, and content regions", () => {
    renderShell();

    expect(screen.getByTestId("admin-shell")).toBeInTheDocument();
    expect(screen.getByText("admin-content")).toBeInTheDocument();
    expect(screen.getAllByText("Admin Panel").length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: "Admin navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute("href", "/en/admin/users");
    expect(screen.getByRole("link", { name: "Training Programs" })).toHaveAttribute(
      "href",
      "/en/admin/training/programs"
    );
    expect(screen.getByRole("link", { name: "Activity / Audit" })).toHaveAttribute(
      "href",
      "/en/admin/activity"
    );
    expect(screen.getAllByText("admin@example.com").length).toBeGreaterThan(0);
  });

  it("uses the longest matching route for active nested navigation", () => {
    usePathname.mockReturnValue("/en/admin/events/registrations/registration-id");
    renderShell();

    expect(screen.getByRole("link", { name: "Event Registrations" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Events" })).not.toHaveAttribute("aria-current");
  });

  it("opens and closes the accessible mobile navigation", () => {
    renderShell();
    const menuButton = screen.getByRole("button", { name: "Menu" });

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog", { name: "Admin navigation" })).toBeInTheDocument();
    expect(document.body.dataset.menuOpen).toBe("true");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Admin navigation" })).not.toBeInTheDocument();
    expect(document.body.dataset.menuOpen).toBe("false");
  });

  it.each([
    ["en", "Dashboard"],
    ["tr", "Pano"],
    ["ar", "لوحة المعلومات"],
    ["fa", "داشبورد"]
  ] as const)("renders localized navigation labels for %s", (locale, dashboardLabel) => {
    usePathname.mockReturnValue(`/${locale}/admin`);
    renderShell(locale);

    expect(screen.getAllByText(dashboardLabel).length).toBeGreaterThan(0);
  });

  it.each(["ar", "fa"] as const)("uses an explicit RTL shell direction for %s", (locale) => {
    usePathname.mockReturnValue(`/${locale}/admin`);
    renderShell(locale);

    expect(screen.getByTestId("admin-shell")).toHaveAttribute("dir", "rtl");
  });
});
