import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => key)
}));

import { AdminActivity } from "@/components/admin/AdminActivity";
import type { AdminUserActivityResult } from "@/lib/directus/admin-activity";

const readyResult: AdminUserActivityResult = {
  state: "ready",
  entries: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      action: "user.role_changed",
      administratorId: "11111111-1111-4111-8111-111111111111",
      administratorEmail: "admin@example.com",
      targetUserId: "22222222-2222-4222-8222-222222222222",
      targetEmail: "target@example.com",
      previousValue: "websiteUser",
      newValue: "websiteAdmin",
      dateCreated: "2026-08-20T10:00:00Z"
    }
  ]
};

describe("AdminActivity", () => {
  it("renders safe, localized audit details in desktop and responsive views", async () => {
    const view = render(await AdminActivity({ locale: "ar", result: readyResult }));

    expect(screen.getByRole("heading", { name: "activity.title" })).toBeInTheDocument();
    expect(screen.getAllByText("activity.actions.roleChanged").length).toBeGreaterThan(0);
    expect(screen.getAllByText("admin@example.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("target@example.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("users.roles.websiteUser").length).toBeGreaterThan(0);
    expect(screen.getAllByText("users.roles.websiteAdmin").length).toBeGreaterThan(0);
    expect(view.container.textContent).not.toMatch(/password|token|cookie/i);
  });

  it("renders the unavailable state without leaking backend detail", async () => {
    render(await AdminActivity({ locale: "en", result: { state: "unavailable" } }));

    expect(screen.getByRole("heading", { name: "activity.unavailableTitle" })).toBeInTheDocument();
    expect(screen.getByText("activity.unavailableMessage")).toBeInTheDocument();
    expect(screen.queryByText(/Directus|403|FORBIDDEN/i)).not.toBeInTheDocument();
  });
});
