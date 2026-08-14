import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { AccountSectionNavigation } from "@/components/account/AccountSectionNavigation";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/account/scholarship-exams"
}));

describe("AccountSectionNavigation", () => {
  it("links every account page and marks the current page", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <AccountSectionNavigation locale="en" />
      </NextIntlClientProvider>
    );

    expect(screen.getByRole("link", { name: /Overview/ })).toHaveAttribute("href", "/en/account");
    expect(screen.getByRole("link", { name: /Profile/ })).toHaveAttribute(
      "href",
      "/en/account/profile"
    );
    expect(screen.getByRole("link", { name: /Training Applications/ })).toHaveAttribute(
      "href",
      "/en/account/training-applications"
    );
    expect(screen.getByRole("link", { name: /Scholarship Exams/ })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: /My Trainings/ })).toHaveAttribute(
      "href",
      "/en/account/my-trainings"
    );
    expect(screen.getByRole("link", { name: /Event Registrations/ })).toHaveAttribute(
      "href",
      "/en/account/event-registrations"
    );
  });
});
