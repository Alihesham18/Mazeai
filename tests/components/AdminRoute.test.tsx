import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdmin, setRequestLocale } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  setRequestLocale: vi.fn()
}));

vi.mock("next-intl/server", () => ({ setRequestLocale }));
vi.mock("@/lib/auth/admin", () => ({ requireAdmin }));
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
vi.mock("@/components/admin/AdminPlaceholder", () => ({
  AdminPlaceholder: ({ titleKey, dashboard }: { titleKey: string; dashboard?: boolean }) => (
    <section>
      <h1>{titleKey}</h1>
      <p>{dashboard ? "dashboardPlaceholder" : "managementPlaceholder"}</p>
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

  it("keeps the admin root as a dashboard placeholder without fake statistics", async () => {
    render(await AdminPage({ params: { locale: "ar" } }));

    expect(setRequestLocale).toHaveBeenCalledWith("ar");
    expect(screen.getByRole("heading", { name: "navigation.dashboard" })).toBeInTheDocument();
    expect(screen.getByText("dashboardPlaceholder")).toBeInTheDocument();
  });
});
