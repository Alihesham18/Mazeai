import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminDashboardData, requireAdmin, setRequestLocale } = vi.hoisted(() => ({
  getAdminDashboardData: vi.fn(),
  requireAdmin: vi.fn(),
  setRequestLocale: vi.fn()
}));

vi.mock("next-intl/server", () => ({ setRequestLocale }));
vi.mock("@/lib/auth/admin", () => ({ requireAdmin }));
vi.mock("@/lib/directus/admin-dashboard", () => ({ getAdminDashboardData }));
vi.mock("@/components/admin/AdminShell", () => ({
  AdminShell: ({
    children,
    identity,
    locale
  }: {
    children: React.ReactNode;
    identity: { email: string; firstName: string; lastName: string };
    locale: string;
  }) => (
    <div data-testid="admin-shell" data-locale={locale} data-email={identity.email}>
      {children}
    </div>
  )
}));
vi.mock("@/components/admin/AdminDashboard", () => ({
  AdminDashboard: ({
    data,
    locale
  }: {
    data: { metrics: { totalUsers: number } };
    locale: string;
  }) => (
    <section data-testid="admin-dashboard" data-locale={locale}>
      <h1>dashboard</h1>
      <p>{data.metrics.totalUsers}</p>
    </section>
  )
}));

import AdminLayout from "@/app/[locale]/admin/layout";
import AdminPage from "@/app/[locale]/admin/page";

describe("protected admin route", () => {
  beforeEach(() => {
    requireAdmin.mockReset().mockResolvedValue({
      id: "admin-user",
      email: "admin@example.com",
      firstName: "Maze",
      lastName: "Admin",
      roleId: "server-only-role-id"
    });
    getAdminDashboardData.mockReset().mockResolvedValue({
      administratorFirstName: "Maze",
      metrics: { totalUsers: 11 },
      recentActivity: []
    });
    setRequestLocale.mockClear();
  });

  it("invokes the trusted server-side admin guard from the layout", async () => {
    const view = await AdminLayout({ children: <p>protected</p>, params: { locale: "tr" } });
    render(view);

    expect(requireAdmin).toHaveBeenCalledWith({ locale: "tr", destination: "/admin" });
    expect(screen.getByTestId("admin-shell")).toHaveAttribute("data-email", "admin@example.com");
    expect(screen.queryByText("server-only-role-id")).not.toBeInTheDocument();
    expect(screen.getByText("protected")).toBeInTheDocument();
  });

  it("loads the real server-side dashboard data for the localized admin root", async () => {
    render(await AdminPage({ params: { locale: "ar" } }));

    expect(setRequestLocale).toHaveBeenCalledWith("ar");
    expect(getAdminDashboardData).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("admin-dashboard")).toHaveAttribute("data-locale", "ar");
    expect(screen.getByRole("heading", { name: "dashboard" })).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
  });
});
