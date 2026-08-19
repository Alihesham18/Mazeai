import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getTranslations, requireAdmin, setRequestLocale } = vi.hoisted(() => ({
  getTranslations: vi.fn(async () => (key: string) => key),
  requireAdmin: vi.fn(),
  setRequestLocale: vi.fn()
}));

vi.mock("next-intl/server", () => ({ getTranslations, setRequestLocale }));
vi.mock("@/lib/auth/admin", () => ({ requireAdmin }));

import AdminLayout from "@/app/[locale]/admin/layout";
import AdminPage from "@/app/[locale]/admin/page";

describe("protected admin route", () => {
  beforeEach(() => {
    requireAdmin.mockReset().mockResolvedValue({ id: "admin-user" });
    getTranslations.mockClear();
    setRequestLocale.mockClear();
  });

  it("invokes the trusted server-side admin guard from the layout", async () => {
    const view = await AdminLayout({ children: <p>protected</p>, params: { locale: "tr" } });
    render(view);

    expect(requireAdmin).toHaveBeenCalledWith({ locale: "tr", destination: "/admin" });
    expect(screen.getByText("protected")).toBeInTheDocument();
  });

  it("renders only the localized authorization proof content", async () => {
    render(await AdminPage({ params: { locale: "ar" } }));

    expect(setRequestLocale).toHaveBeenCalledWith("ar");
    expect(getTranslations).toHaveBeenCalledWith({ locale: "ar", namespace: "adminAuth" });
    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    expect(screen.getByText("confirmed")).toBeInTheDocument();
  });
});
