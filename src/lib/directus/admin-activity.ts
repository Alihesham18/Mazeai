import "server-only";

import { createItem, readItems, readUsers, withToken, type RestCommand } from "@directus/sdk";
import { unstable_noStore as noStore } from "next/cache";

import { requireAdmin, type AdminPrincipal } from "@/lib/auth/admin";
import { getAuthenticatedDirectusSession } from "@/lib/directus/auth";
import { createDirectusRestClient } from "@/lib/directus/client";
import { logDirectusDiagnostic } from "@/lib/directus/diagnostics";
import type { DirectusSchema } from "@/lib/directus/types";

export const adminUserActivityActions = [
  "user.suspended",
  "user.activated",
  "user.role_changed",
  "user.password_reset_requested"
] as const;

export type AdminUserActivityAction = (typeof adminUserActivityActions)[number];

export interface AdminUserActivityEntry {
  id: string;
  action: AdminUserActivityAction;
  administratorId: string;
  administratorEmail: string;
  targetUserId: string;
  targetEmail: string;
  previousValue: string | null;
  newValue: string | null;
  dateCreated: string;
}

export type AdminUserActivityResult =
  { state: "ready"; entries: AdminUserActivityEntry[] } | { state: "unavailable" };

interface RecordAdminUserActivityInput {
  action: AdminUserActivityAction;
  administrator: AdminPrincipal;
  targetUserId: string;
  targetEmail: string;
  previousValue?: string | null;
  newValue?: string | null;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const activityValues = ["active", "suspended", "websiteUser", "websiteAdmin"] as const;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function relationId(value: unknown) {
  if (typeof value === "string") return value.trim().toLowerCase();
  if (value && typeof value === "object" && "id" in value) {
    return text((value as { id?: unknown }).id).toLowerCase();
  }
  return "";
}

function configuredManagementToken() {
  return text(process.env.DIRECTUS_USER_MANAGEMENT_TOKEN);
}

function configuredManagedRoleIds() {
  const websiteUser = text(process.env.DIRECTUS_WEBSITE_USER_ROLE_ID).toLowerCase();
  const websiteAdmin = text(process.env.DIRECTUS_ADMIN_ROLE_ID).toLowerCase();
  return uuidPattern.test(websiteUser) && uuidPattern.test(websiteAdmin) && websiteUser !== websiteAdmin
    ? { websiteAdmin, all: [websiteUser, websiteAdmin] }
    : null;
}

function validOptionalValue(value: string | null | undefined) {
  return value == null || activityValues.includes(value as (typeof activityValues)[number]);
}

function validActivityInput(input: RecordAdminUserActivityInput) {
  return (
    adminUserActivityActions.includes(input.action) &&
    uuidPattern.test(input.administrator.id) &&
    uuidPattern.test(input.targetUserId) &&
    text(input.administrator.email).length > 0 &&
    text(input.administrator.email).length <= 254 &&
    text(input.targetEmail).length > 0 &&
    text(input.targetEmail).length <= 254 &&
    validOptionalValue(input.previousValue) &&
    validOptionalValue(input.newValue)
  );
}

async function trustedManagedUsers(
  request: <Output>(command: RestCommand<Output, DirectusSchema>) => Promise<Output>,
  input: RecordAdminUserActivityInput,
  managedRoleIds: { websiteAdmin: string; all: string[] }
) {
  const administratorId = input.administrator.id.toLowerCase();
  const targetUserId = input.targetUserId.toLowerCase();
  const expectedIds = new Set([administratorId, targetUserId]);
  const users = await request(
    readUsers({
      fields: ["id", "email", "role"],
      filter: {
        _and: [
          { id: { _in: [...expectedIds] } },
          { role: { _in: managedRoleIds.all } }
        ]
      },
      limit: expectedIds.size
    })
  );
  const usersById = new Map(
    users.map((user) => [
      text(user.id).toLowerCase(),
      { email: text(user.email).toLowerCase(), role: relationId(user.role) }
    ])
  );

  return (
    usersById.size === expectedIds.size &&
    usersById.get(administratorId)?.email === text(input.administrator.email).toLowerCase() &&
    usersById.get(administratorId)?.role === managedRoleIds.websiteAdmin &&
    usersById.get(targetUserId)?.email === text(input.targetEmail).toLowerCase()
  );
}

export async function recordAdminUserActivity(
  input: RecordAdminUserActivityInput
): Promise<boolean> {
  const token = configuredManagementToken();
  const managedRoleIds = configuredManagedRoleIds();
  const client = createDirectusRestClient();

  if (!token || !managedRoleIds || !client) {
    logDirectusDiagnostic(
      "admin-activity.write.configuration",
      new Error("Admin activity writer is not configured")
    );
    return false;
  }

  if (!validActivityInput(input)) {
    logDirectusDiagnostic(
      "admin-activity.write.validation",
      new Error("Admin activity input failed trusted server validation")
    );
    return false;
  }

  try {
    const request = <T>(command: Parameters<typeof client.request<T>>[0]) =>
      client.request(withToken(token, command));
    if (!(await trustedManagedUsers(request, input, managedRoleIds))) {
      throw new Error("Admin activity identities failed managed-user validation");
    }

    await request(
      createItem("admin_activity", {
        action: input.action,
        administrator: input.administrator.id.toLowerCase(),
        administrator_email: text(input.administrator.email),
        target_user: input.targetUserId.toLowerCase(),
        target_email: text(input.targetEmail),
        previous_value: input.previousValue ?? null,
        new_value: input.newValue ?? null
      })
    );
    return true;
  } catch (caught) {
    logDirectusDiagnostic("admin-activity.write", caught);
    return false;
  }
}

function normalizeEntry(item: {
  id?: unknown;
  action?: unknown;
  administrator?: unknown;
  administrator_email?: unknown;
  target_user?: unknown;
  target_email?: unknown;
  previous_value?: unknown;
  new_value?: unknown;
  date_created?: unknown;
}): AdminUserActivityEntry | null {
  const id = text(item.id).toLowerCase();
  const action = text(item.action) as AdminUserActivityAction;
  const administratorId = relationId(item.administrator);
  const targetUserId = relationId(item.target_user);
  const administratorEmail = text(item.administrator_email);
  const targetEmail = text(item.target_email);
  const dateCreated = text(item.date_created);

  if (
    !uuidPattern.test(id) ||
    !adminUserActivityActions.includes(action) ||
    !uuidPattern.test(administratorId) ||
    !uuidPattern.test(targetUserId) ||
    !administratorEmail ||
    !targetEmail ||
    !Number.isFinite(Date.parse(dateCreated))
  ) {
    return null;
  }

  return {
    id,
    action,
    administratorId,
    administratorEmail,
    targetUserId,
    targetEmail,
    previousValue: text(item.previous_value) || null,
    newValue: text(item.new_value) || null,
    dateCreated
  };
}

export async function getAdminUserActivity(): Promise<AdminUserActivityResult> {
  noStore();
  await requireAdmin();

  const client = createDirectusRestClient();
  const session = await getAuthenticatedDirectusSession();
  if (!client || !session) return { state: "unavailable" };

  try {
    const items = await client.request(
      withToken(
        session.accessToken,
        readItems("admin_activity", {
          fields: [
            "id",
            "action",
            "administrator",
            "administrator_email",
            "target_user",
            "target_email",
            "previous_value",
            "new_value",
            "date_created"
          ],
          sort: ["-date_created"],
          limit: 100
        })
      )
    );

    return {
      state: "ready",
      entries: items.flatMap((item) => {
        const normalized = normalizeEntry(item);
        return normalized ? [normalized] : [];
      })
    };
  } catch (caught) {
    logDirectusDiagnostic("admin-activity.read", caught);
    return { state: "unavailable" };
  }
}
