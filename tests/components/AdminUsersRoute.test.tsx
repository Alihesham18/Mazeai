import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminUserById, getAdminUsers, notFound, setRequestLocale } = vi.hoisted(() => ({
  getAdminUserById: vi.fn(),
  getAdminUsers: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  setRequestLocale: vi.fn()
}));

vi.mock("next-intl/server", () => ({ setRequestLocale }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/lib/directus/admin-users", () => ({ getAdminUserById, getAdminUsers }));
vi.mock("@/components/admin/AdminUsers", () => ({
  AdminUsers: ({ locale, result }: { locale: string; result: { state: string } }) => (
    <div data-testid="users-page" data-locale={locale} data-state={result.state} />
  ),
  AdminUserDetail: ({ locale, user }: { locale: string; user: { email: string } | null }) => (
    <div data-testid="user-detail" data-locale={locale} data-email={user?.email} />
  )
}));

import AdminUserDetailPage from "@/app/[locale]/admin/users/[userId]/page";
import AdminUsersPage from "@/app/[locale]/admin/users/page";

const userId = "33333333-3333-4333-8333-333333333333";

describe("admin user routes", () => {
  beforeEach(() => {
    setRequestLocale.mockClear();
    notFound.mockClear();
    getAdminUsers.mockReset().mockResolvedValue({
      state: "ready",
      users: [],
      query: { page: 1, query: "", status: null, role: null },
      totalCount: 0,
      totalPages: 1
    });
    getAdminUserById.mockReset().mockResolvedValue({
      state: "ready",
      user: { email: "ali@example.com" }
    });
  });

  it("passes shareable search, status, role, and page parameters to the server service", async () => {
    render(
      await AdminUsersPage({
        params: { locale: "fa" },
        searchParams: { q: "ali", status: "active", role: "websiteAdmin", page: "2" }
      })
    );

    expect(setRequestLocale).toHaveBeenCalledWith("fa");
    expect(getAdminUsers).toHaveBeenCalledWith({
      q: "ali",
      status: "active",
      role: "websiteAdmin",
      page: "2"
    });
    expect(screen.getByTestId("users-page")).toHaveAttribute("data-locale", "fa");
  });

  it("loads a safe user detail through the server service", async () => {
    render(await AdminUserDetailPage({ params: { locale: "en", userId } }));

    expect(getAdminUserById).toHaveBeenCalledWith(userId);
    expect(screen.getByTestId("user-detail")).toHaveAttribute("data-email", "ali@example.com");
  });

  it("uses notFound for invalid, inaccessible, or excluded user details", async () => {
    getAdminUserById.mockResolvedValue({ state: "notFound" });

    await expect(
      AdminUserDetailPage({ params: { locale: "en", userId: "invalid" } })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
