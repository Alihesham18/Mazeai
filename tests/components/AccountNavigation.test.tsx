import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import { AccountNavigation } from "@/components/navigation/AccountNavigation";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/account"
}));

vi.mock("@/lib/auth/actions", () => ({
  logoutAction: vi.fn()
}));

describe("AccountNavigation", () => {
  it("opens dedicated account destinations", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <AccountNavigation
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
      </NextIntlClientProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
    expect(screen.getByRole("menuitem", { name: "Profile" })).toHaveAttribute(
      "href",
      "/en/account/profile"
    );
    expect(screen.getByRole("menuitem", { name: "Training Applications" })).toHaveAttribute(
      "href",
      "/en/account/training-applications"
    );
    expect(screen.getByRole("menuitem", { name: "Scholarship Exams" })).toHaveAttribute(
      "href",
      "/en/account/scholarship-exams"
    );
    expect(screen.getByRole("menuitem", { name: "Event Registrations" })).toHaveAttribute(
      "href",
      "/en/account/event-registrations"
    );
    consoleError.mockRestore();
  });
});
