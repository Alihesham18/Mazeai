import "server-only";

import { aggregate, readItems, withToken } from "@directus/sdk";
import { unstable_noStore as noStore } from "next/cache";
import { normalizeDirectusRoleId, requireAdmin } from "@/lib/auth/admin";
import { getAuthenticatedDirectusSession } from "@/lib/directus/auth";
import { createDirectusRestClient } from "@/lib/directus/client";
import { logDirectusDiagnostic } from "@/lib/directus/diagnostics";

export type AdminDashboardMetricKey =
  | "totalUsers"
  | "trainingPrograms"
  | "trainingApplications"
  | "enrolledTrainings"
  | "scholarshipRecords"
  | "discountCodes"
  | "events"
  | "eventRegistrations";

export type AdminDashboardMetrics = Record<AdminDashboardMetricKey, number | null>;

export type AdminDashboardActivityType =
  "trainingApplication" | "scholarshipAttempt" | "eventRegistration";

export interface AdminDashboardActivity {
  id: string;
  type: AdminDashboardActivityType;
  status: string;
  dateCreated: string;
}

export interface AdminDashboardData {
  administratorFirstName: string;
  metrics: AdminDashboardMetrics;
  recentActivity: AdminDashboardActivity[] | null;
}

const unavailableMetrics: AdminDashboardMetrics = {
  totalUsers: null,
  trainingPrograms: null,
  trainingApplications: null,
  enrolledTrainings: null,
  scholarshipRecords: null,
  discountCodes: null,
  events: null,
  eventRegistrations: null
};

function normalizedCount(result: unknown) {
  if (!Array.isArray(result) || !result[0] || typeof result[0] !== "object") return null;
  const count = (result[0] as { count?: unknown }).count;
  const value =
    count && typeof count === "object" && "id" in count ? (count as { id?: unknown }).id : count;
  const number = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function normalizedActivity(
  type: AdminDashboardActivityType,
  item: { id?: unknown; status?: unknown; date_created?: unknown }
) {
  const id = typeof item.id === "string" ? item.id.trim() : String(item.id ?? "").trim();
  const status = typeof item.status === "string" ? item.status.trim() : "";
  const dateCreated = typeof item.date_created === "string" ? item.date_created.trim() : "";
  const timestamp = Date.parse(dateCreated);

  return id && status && dateCreated && Number.isFinite(timestamp)
    ? ({ id, type, status, dateCreated } satisfies AdminDashboardActivity)
    : null;
}

async function safeRead<T>(stage: string, operation: () => Promise<T>): Promise<T | null> {
  try {
    return await operation();
  } catch (caught) {
    logDirectusDiagnostic(stage, caught);
    return null;
  }
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  noStore();

  // Dashboard reads independently enforce the trusted admin boundary. The layout guard is not
  // treated as authorization for server-side data access.
  const admin = await requireAdmin();
  const client = createDirectusRestClient();
  const session = await getAuthenticatedDirectusSession();
  if (!client || !session) throw new Error("Admin dashboard authorization failed");

  const request = <T>(command: Parameters<typeof client.request<T>>[0]) =>
    client.request(withToken(session.accessToken, command));
  const websiteUserRoleId = normalizeDirectusRoleId(process.env.DIRECTUS_WEBSITE_USER_ROLE_ID);
  if (!websiteUserRoleId) {
    logDirectusDiagnostic(
      "admin-dashboard.count-users.configuration",
      new Error("Website User role is not configured")
    );
  }

  const metricReads = {
    totalUsers: websiteUserRoleId
      ? safeRead("admin-dashboard.count-users", () =>
          request(
            aggregate("directus_users", {
              aggregate: { count: ["id"] },
              query: { filter: { role: { _eq: websiteUserRoleId } } }
            })
          )
        )
      : Promise.resolve(null),
    trainingPrograms: safeRead("admin-dashboard.count-training-programs", () =>
      request(aggregate("training_programs", { aggregate: { count: ["id"] } }))
    ),
    trainingApplications: safeRead("admin-dashboard.count-training-applications", () =>
      request(aggregate("training_applications", { aggregate: { count: ["id"] } }))
    ),
    enrolledTrainings: safeRead("admin-dashboard.count-enrolled-trainings", () =>
      request(
        aggregate("training_applications", {
          aggregate: { count: ["id"] },
          query: { filter: { status: { _eq: "accepted" } } }
        })
      )
    ),
    scholarshipRecords: safeRead("admin-dashboard.count-scholarship-records", () =>
      request(aggregate("scholarship_exam_attempts", { aggregate: { count: ["id"] } }))
    ),
    discountCodes: safeRead("admin-dashboard.count-discount-codes", () =>
      request(aggregate("discount_codes", { aggregate: { count: ["id"] } }))
    ),
    events: safeRead("admin-dashboard.count-events", () =>
      request(aggregate("event", { aggregate: { count: ["id"] } }))
    ),
    eventRegistrations: safeRead("admin-dashboard.count-event-registrations", () =>
      request(aggregate("event_registrations", { aggregate: { count: ["id"] } }))
    )
  };

  const recentReads = {
    trainingApplications: safeRead("admin-dashboard.recent-training-applications", () =>
      request(
        readItems("training_applications", {
          fields: ["id", "status", "date_created"],
          sort: ["-date_created"],
          limit: 5
        })
      )
    ),
    scholarshipAttempts: safeRead("admin-dashboard.recent-scholarship-attempts", () =>
      request(
        readItems("scholarship_exam_attempts", {
          fields: ["id", "status", "date_created"],
          sort: ["-date_created"],
          limit: 5
        })
      )
    ),
    eventRegistrations: safeRead("admin-dashboard.recent-event-registrations", () =>
      request(
        readItems("event_registrations", {
          fields: ["id", "status", "date_created"],
          sort: ["-date_created"],
          limit: 5
        })
      )
    )
  };

  const [metricEntries, recentEntries] = await Promise.all([
    Promise.all(
      Object.entries(metricReads).map(async ([key, operation]) => [key, await operation] as const)
    ),
    Promise.all(
      Object.entries(recentReads).map(async ([key, operation]) => [key, await operation] as const)
    )
  ]);

  const metrics = { ...unavailableMetrics };
  for (const [key, result] of metricEntries) {
    metrics[key as AdminDashboardMetricKey] = normalizedCount(result);
  }

  const recentResults = Object.fromEntries(recentEntries) as {
    trainingApplications: Awaited<(typeof recentReads)["trainingApplications"]>;
    scholarshipAttempts: Awaited<(typeof recentReads)["scholarshipAttempts"]>;
    eventRegistrations: Awaited<(typeof recentReads)["eventRegistrations"]>;
  };
  const anyRecentSourceAvailable = Object.values(recentResults).some((result) => result !== null);
  const recentActivity = anyRecentSourceAvailable
    ? [
        ...(recentResults.trainingApplications ?? []).map((item) =>
          normalizedActivity("trainingApplication", item)
        ),
        ...(recentResults.scholarshipAttempts ?? []).map((item) =>
          normalizedActivity("scholarshipAttempt", item)
        ),
        ...(recentResults.eventRegistrations ?? []).map((item) =>
          normalizedActivity("eventRegistration", item)
        )
      ]
        .filter((item): item is AdminDashboardActivity => item !== null)
        .sort((left, right) => Date.parse(right.dateCreated) - Date.parse(left.dateCreated))
        .slice(0, 6)
    : null;

  return {
    administratorFirstName: admin.firstName,
    metrics,
    recentActivity
  };
}
