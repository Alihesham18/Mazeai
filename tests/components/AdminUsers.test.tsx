import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import fa from "../../messages/fa.json";
import tr from "../../messages/tr.json";

vi.mock("server-only", () => ({}));
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string, values?: Record<string, number>) => {
    if (key === "users.totalResults") return `${values?.count} users`;
    if (key === "users.pageOf") return `page ${values?.page} of ${values?.pages}`;
    return key;
  })
}));

import { AdminUserDetail, AdminUsers } from "@/components/admin/AdminUsers";
import type { AdminUserSummary, AdminUsersResult } from "@/lib/directus/admin-users";

const user: AdminUserSummary = {
  id: "33333333-3333-4333-8333-333333333333",
  firstName: "Ali",
  lastName: "Example",
  email: "ali@example.com",
  accountNumber: "SMA-2026-000001",
  status: "active",
  lastAccess: "2026-08-19T09:00:00Z",
  role: "websiteUser"
};

const readyResult: AdminUsersResult = {
  state: "ready",
  users: [user],
  query: { page: 1, query: "ali", status: "active" },
  totalCount: 21,
  totalPages: 2
};

describe("AdminUsers", () => {
  it("renders the safe user directory, filters, and localized pagination/detail links", async () => {
    const view = render(await AdminUsers({ locale: "tr", result: readyResult }));

    expect(screen.getByRole("heading", { name: "users.management" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toHaveValue("ali");
    expect(screen.getByRole("combobox")).toHaveValue("active");
    expect(screen.getAllByText("Ali Example").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ali@example.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SMA-2026-000001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("users.statuses.active").length).toBeGreaterThan(0);
    expect(
      view.container.querySelector('a[href="/tr/admin/users/33333333-3333-4333-8333-333333333333"]')
    ).toBeInTheDocument();
    expect(
      view.container.querySelector('a[href="/tr/admin/users?q=ali&status=active&page=2"]')
    ).toBeInTheDocument();
    expect(view.container.textContent).not.toMatch(/password|refresh.?token|auth_data/i);
  });

  it("renders a safe server failure state without backend details", async () => {
    render(
      await AdminUsers({
        locale: "en",
        result: {
          state: "unavailable",
          query: { page: 1, query: "", status: null }
        }
      })
    );

    expect(screen.getByRole("heading", { name: "users.unavailableTitle" })).toBeInTheDocument();
    expect(screen.getByText("users.unavailableMessage")).toBeInTheDocument();
    expect(screen.queryByText(/Directus|FORBIDDEN|403/i)).not.toBeInTheDocument();
  });

  it("renders safe user details and an RTL-compatible localized back link", async () => {
    const view = render(<div dir="rtl">{await AdminUserDetail({ locale: "ar", user })}</div>);

    expect(screen.getByRole("heading", { name: "Ali Example" })).toBeInTheDocument();
    expect(screen.getAllByText("ali@example.com").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "users.backToUsers" })).toHaveAttribute(
      "href",
      "/ar/admin/users"
    );
    expect(view.container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });

  it("provides the user-management labels in EN, TR, AR, and FA", () => {
    const catalogs = { en, tr, ar, fa } as const;
    const keys = [
      "management",
      "searchUsers",
      "search",
      "status",
      "allStatuses",
      "name",
      "email",
      "accountNumber",
      "lastAccess",
      "role",
      "viewDetails",
      "previous",
      "next",
      "noUsersFound",
      "unavailable",
      "userDetails",
      "backToUsers"
    ] as const;

    for (const catalog of Object.values(catalogs)) {
      for (const key of keys) expect(catalog.adminAuth.users[key].trim()).not.toBe("");
      for (const status of ["active", "invited", "draft", "suspended", "archived"] as const) {
        expect(catalog.adminAuth.users.statuses[status].trim()).not.toBe("");
      }
    }
  });
});
