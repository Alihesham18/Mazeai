import "server-only";

import {
  aggregate,
  readItems,
  readUsers,
  updateUser,
  withToken,
  type RestCommand
} from "@directus/sdk";
import { unstable_noStore as noStore } from "next/cache";

import { siteConfig } from "@/config/site";
import { isLocale } from "@/i18n/routing";
import { normalizeDirectusRoleId, requireAdmin, type AdminPrincipal } from "@/lib/auth/admin";
import { recordAdminUserActivity } from "@/lib/directus/admin-activity";
import { getAuthenticatedDirectusSession, requestDirectusPasswordReset } from "@/lib/directus/auth";
import { createDirectusRestClient } from "@/lib/directus/client";
import { logDirectusDiagnostic } from "@/lib/directus/diagnostics";
import type { DirectusSchema } from "@/lib/directus/types";

export const adminUsersPageSize = 20;

export const adminUserStatuses = ["active", "invited", "draft", "suspended", "archived"] as const;

export type AdminUserStatus = (typeof adminUserStatuses)[number];

export const adminUserRoles = ["websiteUser", "websiteAdmin"] as const;
export type AdminUserRole = (typeof adminUserRoles)[number];

export interface AdminUserListQuery {
  page: number;
  query: string;
  status: AdminUserStatus | null;
  role: AdminUserRole | null;
}

export interface AdminUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountNumber: string | null;
  status: AdminUserStatus | null;
  lastAccess: string | null;
  role: AdminUserRole;
}

export type AdminUsersResult =
  | {
      state: "ready";
      users: AdminUserSummary[];
      query: AdminUserListQuery;
      totalCount: number;
      totalPages: number;
    }
  | {
      state: "unavailable";
      query: AdminUserListQuery;
    };

export type AdminUserDetailResult =
  { state: "ready"; user: AdminUserSummary } | { state: "notFound" } | { state: "unavailable" };

export const adminUserMutableStatuses = ["active", "suspended"] as const;
export type AdminUserMutableStatus = (typeof adminUserMutableStatuses)[number];

export type AdminUserStatusMutationResult =
  | { state: "updated"; status: AdminUserMutableStatus }
  | { state: "invalidUserId" }
  | { state: "invalidStatus" }
  | { state: "invalidTransition" }
  | { state: "selfTarget" }
  | { state: "notFound" }
  | { state: "unavailable" };

export type AdminUserRoleMutationResult =
  | { state: "updated"; role: AdminUserRole }
  | { state: "invalidUserId" }
  | { state: "invalidRole" }
  | { state: "invalidTransition" }
  | { state: "selfTarget" }
  | { state: "lastAdmin" }
  | { state: "notFound" }
  | { state: "unavailable" };

export type AdminUserPasswordResetResult =
  | { state: "sent" }
  | { state: "invalidUserId" }
  | { state: "invalidLocale" }
  | { state: "notFound" }
  | { state: "unavailable" };

interface ManagedRoleIds {
  websiteUser: string;
  websiteAdmin: string;
}

const userFields = [
  "id",
  "first_name",
  "last_name",
  "email",
  "status",
  "last_access",
  "role"
] as const;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let roleMutationQueue: Promise<void> = Promise.resolve();

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeDate(value: unknown) {
  const candidate = text(value);
  return candidate && Number.isFinite(Date.parse(candidate)) ? candidate : null;
}

function normalizedStatus(value: unknown): AdminUserStatus | null {
  const candidate = text(value).toLowerCase();
  return adminUserStatuses.includes(candidate as AdminUserStatus)
    ? (candidate as AdminUserStatus)
    : null;
}

function normalizedPage(value: unknown) {
  const candidate = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isSafeInteger(candidate) && candidate > 0 ? candidate : 1;
}

export function normalizeAdminUsersQuery(input: {
  page?: string;
  q?: string;
  status?: string;
  role?: string;
}): AdminUserListQuery {
  const status = text(input.status).toLowerCase();
  const role = text(input.role);

  return {
    page: normalizedPage(input.page),
    query: text(input.q).slice(0, 100),
    status: adminUserStatuses.includes(status as AdminUserStatus)
      ? (status as AdminUserStatus)
      : null,
    role: adminUserRoles.includes(role as AdminUserRole) ? (role as AdminUserRole) : null
  };
}

function configuredManagedRoleIds(): ManagedRoleIds | null {
  const websiteUser = normalizeDirectusRoleId(process.env.DIRECTUS_WEBSITE_USER_ROLE_ID);
  const websiteAdmin = normalizeDirectusRoleId(process.env.DIRECTUS_ADMIN_ROLE_ID);

  return websiteUser && websiteAdmin && websiteUser !== websiteAdmin
    ? { websiteUser, websiteAdmin }
    : null;
}

function roleForId(value: unknown, roleIds: ManagedRoleIds): AdminUserRole | null {
  const roleId = normalizeDirectusRoleId(value);
  if (roleId === roleIds.websiteUser) return "websiteUser";
  if (roleId === roleIds.websiteAdmin) return "websiteAdmin";
  return null;
}

function normalizedCount(result: unknown) {
  if (!Array.isArray(result) || !result[0] || typeof result[0] !== "object") return null;
  const count = (result[0] as { count?: unknown }).count;
  const raw =
    count && typeof count === "object" && "id" in count ? (count as { id?: unknown }).id : count;
  const value = typeof raw === "string" || typeof raw === "number" ? Number(raw) : Number.NaN;
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function userFilter(roleIds: ManagedRoleIds, query: AdminUserListQuery) {
  const managedRoleIds = query.role
    ? [roleIds[query.role]]
    : [roleIds.websiteUser, roleIds.websiteAdmin];
  const restrictions: Array<Record<string, unknown>> = [{ role: { _in: managedRoleIds } }];

  if (query.status) restrictions.push({ status: { _eq: query.status } });
  if (query.query) {
    restrictions.push({
      _or: [
        { first_name: { _icontains: query.query } },
        { last_name: { _icontains: query.query } },
        { email: { _icontains: query.query } }
      ]
    });
  }
  return { _and: restrictions };
}

function normalizeUser(
  user: {
    id?: unknown;
    first_name?: unknown;
    last_name?: unknown;
    email?: unknown;
    status?: unknown;
    last_access?: unknown;
    role?: unknown;
  },
  roleIds: ManagedRoleIds,
  accountNumber: string | null
): AdminUserSummary | null {
  const id = text(user.id).toLowerCase();
  const email = text(user.email);
  const role = roleForId(user.role, roleIds);
  if (!uuidPattern.test(id) || !email || !role) return null;

  return {
    id,
    firstName: text(user.first_name),
    lastName: text(user.last_name),
    email,
    accountNumber,
    status: normalizedStatus(user.status),
    lastAccess: safeDate(user.last_access),
    role
  };
}

type AdminRequest = <Output>(command: RestCommand<Output, DirectusSchema>) => Promise<Output>;

async function safeProfilesRead(request: AdminRequest, userIds: string[]) {
  if (userIds.length === 0) return new Map<string, string>();
  try {
    const profiles = await request(
      readItems("user_profiles", {
        fields: ["user", "account_number"],
        filter: { user: { _in: userIds } },
        limit: userIds.length
      })
    );
    return new Map(
      profiles.flatMap((profile) => {
        const userId = typeof profile.user === "string" ? profile.user : "";
        const accountNumber = text(profile.account_number);
        return userId && accountNumber ? [[userId.toLowerCase(), accountNumber] as const] : [];
      })
    );
  } catch (caught) {
    logDirectusDiagnostic("admin-users.read-profiles", caught);
    return new Map<string, string>();
  }
}

async function adminRequestContext(principal?: AdminPrincipal) {
  const authorizedPrincipal = principal ?? (await requireAdmin());
  const roleIds = configuredManagedRoleIds();
  const client = createDirectusRestClient();
  const session = await getAuthenticatedDirectusSession();
  if (!roleIds || !client || !session) {
    logDirectusDiagnostic(
      "admin-users.configuration",
      new Error("Managed user directory is not configured")
    );
    return null;
  }

  return {
    principal: authorizedPrincipal,
    roleIds,
    request: <T>(command: Parameters<typeof client.request<T>>[0]) =>
      client.request(withToken(session.accessToken, command))
  };
}

function managementRequestContext() {
  const roleIds = configuredManagedRoleIds();
  const token = text(process.env.DIRECTUS_USER_MANAGEMENT_TOKEN);
  const client = createDirectusRestClient();
  if (!roleIds || !token || !client) {
    logDirectusDiagnostic(
      "admin-users.management.configuration",
      new Error("Admin user-management service is not configured")
    );
    return null;
  }

  return {
    roleIds,
    request: <T>(command: Parameters<typeof client.request<T>>[0]) =>
      client.request(withToken(token, command))
  };
}

async function withRoleMutationLock<T>(operation: () => Promise<T>): Promise<T> {
  const previous = roleMutationQueue;
  let release: () => void = () => {};
  roleMutationQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await operation();
  } finally {
    release();
  }
}

export async function getAdminUsers(input: {
  page?: string;
  q?: string;
  status?: string;
  role?: string;
}): Promise<AdminUsersResult> {
  noStore();
  const query = normalizeAdminUsersQuery(input);
  const context = await adminRequestContext();
  if (!context) return { state: "unavailable", query };
  const filter = userFilter(context.roleIds, query);

  try {
    const countResult = await context.request(
      aggregate("directus_users", {
        aggregate: { count: ["id"] },
        query: { filter }
      })
    );
    const totalCount = normalizedCount(countResult);
    if (totalCount === null) throw new Error("Directus returned an invalid user count");

    const totalPages = Math.max(1, Math.ceil(totalCount / adminUsersPageSize));
    const currentQuery = { ...query, page: Math.min(query.page, totalPages) };
    const users = await context.request(
      readUsers({
        fields: userFields,
        filter,
        sort: ["first_name", "last_name", "email"],
        limit: adminUsersPageSize,
        offset: (currentQuery.page - 1) * adminUsersPageSize
      })
    );
    const profileByUser = await safeProfilesRead(
      context.request,
      users.map((user) => text(user.id)).filter(Boolean)
    );
    const normalizedUsers = users.flatMap((user) => {
      const id = text(user.id).toLowerCase();
      const normalized = normalizeUser(user, context.roleIds, profileByUser.get(id) ?? null);
      return normalized ? [normalized] : [];
    });

    return {
      state: "ready",
      users: normalizedUsers,
      query: currentQuery,
      totalCount,
      totalPages
    };
  } catch (caught) {
    logDirectusDiagnostic("admin-users.read-list", caught);
    return { state: "unavailable", query };
  }
}

export async function getAdminUserById(userId: string): Promise<AdminUserDetailResult> {
  noStore();
  const context = await adminRequestContext();
  if (!context) return { state: "unavailable" };
  const id = text(userId).toLowerCase();
  if (!uuidPattern.test(id)) return { state: "notFound" };

  try {
    const users = await context.request(
      readUsers({
        fields: userFields,
        filter: {
          _and: [
            { id: { _eq: id } },
            { role: { _in: [context.roleIds.websiteUser, context.roleIds.websiteAdmin] } }
          ]
        },
        limit: 1
      })
    );
    const user = users[0];
    if (!user) return { state: "notFound" };
    const profileByUser = await safeProfilesRead(context.request, [id]);
    const normalized = normalizeUser(user, context.roleIds, profileByUser.get(id) ?? null);
    return normalized ? { state: "ready", user: normalized } : { state: "notFound" };
  } catch (caught) {
    logDirectusDiagnostic("admin-users.read-detail", caught);
    return { state: "unavailable" };
  }
}

export async function setAdminUserStatus(
  userId: string,
  newStatus: unknown
): Promise<AdminUserStatusMutationResult> {
  const principal = await requireAdmin();
  const context = await adminRequestContext(principal);
  if (!context) return { state: "unavailable" };

  const id = text(userId).toLowerCase();
  if (!uuidPattern.test(id)) return { state: "invalidUserId" };
  const requestedStatus = text(newStatus).toLowerCase();
  if (!adminUserMutableStatuses.includes(requestedStatus as AdminUserMutableStatus)) {
    return { state: "invalidStatus" };
  }
  const status = requestedStatus as AdminUserMutableStatus;
  if (id === principal.id && status === "suspended") return { state: "selfTarget" };

  try {
    const users = await context.request(
      readUsers({
        fields: ["id", "email", "status", "role"],
        filter: {
          _and: [{ id: { _eq: id } }, { role: { _eq: context.roleIds.websiteUser } }]
        },
        limit: 1
      })
    );
    const targetUser = users[0];
    if (!targetUser) return { state: "notFound" };
    const currentStatus = normalizedStatus(targetUser.status);
    const validTransition =
      (currentStatus === "active" && status === "suspended") ||
      (currentStatus === "suspended" && status === "active");
    if (!validTransition) return { state: "invalidTransition" };

    await context.request(updateUser(id, { status }));
    await recordAdminUserActivity({
      action: status === "suspended" ? "user.suspended" : "user.activated",
      administrator: principal,
      targetUserId: id,
      targetEmail: text(targetUser.email),
      previousValue: currentStatus,
      newValue: status
    });
    return { state: "updated", status };
  } catch (caught) {
    logDirectusDiagnostic("admin-users.update-status", caught);
    return { state: "unavailable" };
  }
}

export async function setAdminUserRole(
  userId: string,
  newRole: unknown
): Promise<AdminUserRoleMutationResult> {
  const principal = await requireAdmin();
  const id = text(userId).toLowerCase();
  if (!uuidPattern.test(id)) return { state: "invalidUserId" };

  const requestedRole = text(newRole);
  if (!adminUserRoles.includes(requestedRole as AdminUserRole)) {
    return { state: "invalidRole" };
  }
  const role = requestedRole as AdminUserRole;
  if (id === principal.id && role === "websiteUser") return { state: "selfTarget" };

  const context = managementRequestContext();
  if (!context) return { state: "unavailable" };

  return withRoleMutationLock(async () => {
    try {
      const users = await context.request(
        readUsers({
          fields: ["id", "email", "status", "role"],
          filter: {
            _and: [
              { id: { _eq: id } },
              { role: { _in: [context.roleIds.websiteUser, context.roleIds.websiteAdmin] } }
            ]
          },
          limit: 1
        })
      );
      const targetUser = users[0];
      if (!targetUser) return { state: "notFound" };
      const currentRole = roleForId(targetUser.role, context.roleIds);
      if (!currentRole) return { state: "notFound" };
      if (currentRole === role) return { state: "invalidTransition" };

      if (currentRole === "websiteAdmin" && role === "websiteUser") {
        const countResult = await context.request(
          aggregate("directus_users", {
            aggregate: { count: ["id"] },
            query: {
              filter: {
                _and: [
                  { role: { _eq: context.roleIds.websiteAdmin } },
                  { status: { _eq: "active" } },
                  { id: { _neq: id } }
                ]
              }
            }
          })
        );
        const otherActiveAdmins = normalizedCount(countResult);
        if (otherActiveAdmins === null) throw new Error("Unable to verify active administrators");
        if (otherActiveAdmins < 1) return { state: "lastAdmin" };
      }

      await context.request(updateUser(id, { role: context.roleIds[role] }));
      await recordAdminUserActivity({
        action: "user.role_changed",
        administrator: principal,
        targetUserId: id,
        targetEmail: text(targetUser.email),
        previousValue: currentRole,
        newValue: role
      });
      return { state: "updated", role };
    } catch (caught) {
      logDirectusDiagnostic("admin-users.update-role", caught);
      return { state: "unavailable" };
    }
  });
}

export async function requestAdminUserPasswordReset(
  userId: string,
  localeValue: unknown
): Promise<AdminUserPasswordResetResult> {
  const principal = await requireAdmin();
  const id = text(userId).toLowerCase();
  if (!uuidPattern.test(id)) return { state: "invalidUserId" };
  const locale = text(localeValue);
  if (!isLocale(locale)) return { state: "invalidLocale" };

  const context = await adminRequestContext(principal);
  if (!context) return { state: "unavailable" };

  try {
    const users = await context.request(
      readUsers({
        fields: ["id", "email", "role"],
        filter: {
          _and: [
            { id: { _eq: id } },
            { role: { _in: [context.roleIds.websiteUser, context.roleIds.websiteAdmin] } }
          ]
        },
        limit: 1
      })
    );
    const targetUser = users[0];
    const email = text(targetUser?.email);
    if (!targetUser || !email || !roleForId(targetUser.role, context.roleIds)) {
      return { state: "notFound" };
    }

    const baseUrl = siteConfig.url.replace(/\/+$/, "");
    const resetUrl = `${baseUrl}/${locale}/auth/callback?next=/${locale}/update-password`;
    const result = await requestDirectusPasswordReset(email, resetUrl);
    if (!result.ok) {
      logDirectusDiagnostic(
        "admin-users.password-reset-request",
        new Error(`Password reset provider returned ${result.error}`)
      );
      return { state: "unavailable" };
    }

    await recordAdminUserActivity({
      action: "user.password_reset_requested",
      administrator: principal,
      targetUserId: id,
      targetEmail: email
    });
    return { state: "sent" };
  } catch (caught) {
    logDirectusDiagnostic("admin-users.password-reset-request", caught);
    return { state: "unavailable" };
  }
}
