import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import fa from "../../messages/fa.json";
import tr from "../../messages/tr.json";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(
    async () => (key: string, values?: Record<string, string>) =>
      key === "dashboard.welcomeBack" ? `welcome ${values?.name}` : key
  )
}));

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import type { AdminDashboardData } from "@/lib/directus/admin-dashboard";

const dashboardData: AdminDashboardData = {
  administratorFirstName: "Maze",
  metrics: {
    totalUsers: 11,
    trainingPrograms: 4,
    trainingApplications: 9,
    enrolledTrainings: 3,
    scholarshipRecords: 5,
    discountCodes: null,
    events: 7,
    eventRegistrations: 8
  },
  recentActivity: [
    {
      id: "application-1",
      type: "trainingApplication",
      status: "accepted",
      dateCreated: "2026-08-18T09:00:00Z"
    }
  ]
};

describe("AdminDashboard", () => {
  it("renders real metrics, partial-unavailable state, recent activity, and localized links", async () => {
    const view = render(await AdminDashboard({ data: dashboardData, locale: "tr" }));

    expect(screen.getByRole("heading", { name: "navigation.dashboard" })).toBeInTheDocument();
    expect(screen.getByText("welcome Maze")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
    expect(screen.getByText("dashboard.unavailable")).toBeInTheDocument();
    expect(screen.getByText("activityTypes.trainingApplication")).toBeInTheDocument();
    expect(screen.getByText("statuses.accepted")).toBeInTheDocument();

    expect(view.container.querySelector('a[href="/tr/admin/users"]')).toBeInTheDocument();
    expect(
      view.container.querySelector('a[href="/tr/admin/training/applications"]')
    ).toBeInTheDocument();
    expect(view.container.textContent).not.toMatch(/%|trend|growth/i);
  });

  it("provides every dashboard label in EN, TR, AR, and FA", () => {
    const catalogs = { en, tr, ar, fa } as const;
    const requiredDashboardKeys = [
      "operationalOverview",
      "welcomeBack",
      "recentActivity",
      "quickAccess",
      "view",
      "unavailable",
      "noRecentActivity"
    ] as const;
    const requiredMetricKeys = [
      "totalUsers",
      "trainingPrograms",
      "trainingApplications",
      "enrolledTrainings",
      "scholarships",
      "discountCodes",
      "events",
      "eventRegistrations"
    ] as const;

    for (const catalog of Object.values(catalogs)) {
      for (const key of requiredDashboardKeys) {
        expect(catalog.adminAuth.dashboard[key].trim()).not.toBe("");
      }
      for (const key of requiredMetricKeys) {
        expect(catalog.adminAuth.metrics[key].trim()).not.toBe("");
      }
    }
  });
});
