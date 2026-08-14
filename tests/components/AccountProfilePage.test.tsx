import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { requireAccountUser, ensureUserAccountNumber, getCurrentUserDirectusProfile } = vi.hoisted(
  () => ({
    requireAccountUser: vi.fn(),
    ensureUserAccountNumber: vi.fn(),
    getCurrentUserDirectusProfile: vi.fn()
  })
);

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async () => (key: string) => key)
}));

vi.mock("@/lib/auth/account", () => ({ requireAccountUser }));
vi.mock("@/lib/directus/account-numbers", () => ({ ensureUserAccountNumber }));
vi.mock("@/lib/directus/profile", () => ({ getCurrentUserDirectusProfile }));
vi.mock("@/lib/auth/user", () => ({
  withDirectusProfilePhone: (profile: unknown) => profile
}));
vi.mock("@/components/auth/AuthForms", () => ({
  ProfileForm: () => <div data-testid="profile-form" />
}));

import AccountProfilePage from "@/app/[locale]/account/profile/page";

describe("AccountProfilePage", () => {
  it("loads authenticated profile data and its permanent account number", async () => {
    requireAccountUser.mockResolvedValue({
      id: "user-1",
      email: "ali@example.com",
      firstName: "Ali",
      lastName: "Hesham",
      fullName: "Ali Hesham",
      telephone: "+905525073889",
      status: "active"
    });
    ensureUserAccountNumber.mockResolvedValue({
      ok: true,
      accountNumber: "SMA-2026-000001"
    });
    getCurrentUserDirectusProfile.mockResolvedValue({
      ok: true,
      profile: {
        id: "profile-1",
        account_number: "SMA-2026-000001",
        phone_country_code: "+90",
        phone_number: "5525073889"
      }
    });

    const view = await AccountProfilePage({ params: { locale: "en" } });
    render(view);

    expect(requireAccountUser).toHaveBeenCalledWith("en", "/account/profile");
    expect(ensureUserAccountNumber).toHaveBeenCalledWith("user-1");
    expect(screen.getByText("Ali Hesham")).toBeInTheDocument();
    expect(screen.getByText("SMA-2026-000001")).toBeInTheDocument();
    expect(screen.getByTestId("profile-form")).toBeInTheDocument();
  });
});
