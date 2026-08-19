import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, getSession, logDiagnostic, noStore, request, requireAdmin } = vi.hoisted(
  () => ({
    createClient: vi.fn(),
    getSession: vi.fn(),
    logDiagnostic: vi.fn(),
    noStore: vi.fn(),
    request: vi.fn(),
    requireAdmin: vi.fn()
  })
);

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_noStore: noStore }));
vi.mock("@directus/sdk", () => ({
  aggregate: (collection: string, options: unknown) => ({
    operation: "aggregate",
    collection,
    options
  }),
  readItems: (collection: string, query: unknown) => ({
    operation: "readItems",
    collection,
    query
  }),
  withToken: (token: string, command: unknown) => ({ token, command })
}));
vi.mock("@/lib/auth/admin", () => ({ requireAdmin }));
vi.mock("@/lib/directus/auth", () => ({ getAuthenticatedDirectusSession: getSession }));
vi.mock("@/lib/directus/client", () => ({ createDirectusRestClient: createClient }));
vi.mock("@/lib/directus/diagnostics", () => ({ logDirectusDiagnostic: logDiagnostic }));

import { getAdminDashboardData } from "@/lib/directus/admin-dashboard";

type DashboardCommand = {
  token: string;
  command: {
    operation: "aggregate" | "readItems";
    collection: string;
    options?: { query?: { filter?: { status?: { _eq?: string } } } };
  };
};

const counts: Record<string, number> = {
  directus_users: 11,
  training_programs: 4,
  training_applications: 9,
  scholarship_exam_attempts: 5,
  discount_codes: 6,
  event: 7,
  event_registrations: 8
};

function successfulResponse({ command }: DashboardCommand) {
  if (command.operation === "aggregate") {
    const accepted = command.options?.query?.filter?.status?._eq === "accepted";
    return [{ count: { id: String(accepted ? 3 : counts[command.collection]) } }];
  }

  if (command.collection === "training_applications") {
    return [{ id: "application-1", status: "accepted", date_created: "2026-08-18T09:00:00Z" }];
  }
  if (command.collection === "scholarship_exam_attempts") {
    return [{ id: "scholarship-1", status: "eligible", date_created: "2026-08-19T10:00:00Z" }];
  }
  return [{ id: "registration-1", status: "registered", date_created: "2026-08-17T08:00:00Z" }];
}

describe("admin dashboard data", () => {
  beforeEach(() => {
    noStore.mockClear();
    logDiagnostic.mockClear();
    requireAdmin.mockReset().mockResolvedValue({
      id: "admin-id",
      email: "admin@example.com",
      firstName: "Maze",
      lastName: "Admin",
      roleId: "trusted-server-role-id"
    });
    getSession.mockReset().mockResolvedValue({
      accessToken: "website-admin-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 60_000
    });
    request.mockReset().mockImplementation(successfulResponse);
    createClient.mockReset().mockReturnValue({ request });
  });

  it("uses the trusted admin session for aggregate counts and recent activity", async () => {
    const result = await getAdminDashboardData();

    expect(requireAdmin).toHaveBeenCalledWith();
    expect(noStore).toHaveBeenCalledTimes(1);
    expect(result.metrics).toEqual({
      totalUsers: 11,
      trainingPrograms: 4,
      trainingApplications: 9,
      enrolledTrainings: 3,
      scholarshipRecords: 5,
      discountCodes: 6,
      events: 7,
      eventRegistrations: 8
    });
    expect(result.recentActivity?.map(({ type }) => type)).toEqual([
      "scholarshipAttempt",
      "trainingApplication",
      "eventRegistration"
    ]);
    expect(request).toHaveBeenCalledTimes(11);
    for (const [command] of request.mock.calls as [[DashboardCommand]]) {
      expect(command.token).toBe("website-admin-access-token");
      expect(["aggregate", "readItems"]).toContain(command.command.operation);
    }
    expect(JSON.stringify(result)).not.toContain("website-admin-access-token");
    expect(JSON.stringify(result)).not.toContain("trusted-server-role-id");
  });

  it("enforces accepted status for the enrolled-training count", async () => {
    await getAdminDashboardData();

    expect(request).toHaveBeenCalledWith({
      token: "website-admin-access-token",
      command: {
        operation: "aggregate",
        collection: "training_applications",
        options: {
          aggregate: { count: ["id"] },
          query: { filter: { status: { _eq: "accepted" } } }
        }
      }
    });
  });

  it("isolates a failed metric and logs a safe operation stage", async () => {
    request.mockImplementation((input: DashboardCommand) => {
      if (
        input.command.operation === "aggregate" &&
        input.command.collection === "discount_codes"
      ) {
        throw new Error("Directus denied the aggregate");
      }
      return successfulResponse(input);
    });

    const result = await getAdminDashboardData();

    expect(result.metrics.discountCodes).toBeNull();
    expect(result.metrics.totalUsers).toBe(11);
    expect(logDiagnostic).toHaveBeenCalledWith(
      "admin-dashboard.count-discount-codes",
      expect.any(Error)
    );
  });

  it("reports recent activity as unavailable only when every activity source fails", async () => {
    request.mockImplementation((input: DashboardCommand) => {
      if (input.command.operation === "readItems") throw new Error("Recent activity unavailable");
      return successfulResponse(input);
    });

    const result = await getAdminDashboardData();

    expect(result.recentActivity).toBeNull();
    expect(logDiagnostic).toHaveBeenCalledTimes(3);
  });

  it("returns an empty activity state when reads succeed without records", async () => {
    request.mockImplementation((input: DashboardCommand) =>
      input.command.operation === "readItems" ? [] : successfulResponse(input)
    );

    await expect(getAdminDashboardData()).resolves.toMatchObject({ recentActivity: [] });
  });

  it("does not perform Directus dashboard reads when the admin guard rejects", async () => {
    requireAdmin.mockRejectedValue(new Error("NEXT_NOT_FOUND"));

    await expect(getAdminDashboardData()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(request).not.toHaveBeenCalled();
  });
});
