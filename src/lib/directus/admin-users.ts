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

import {
  normalizeDirectusRoleId,
  requireAdmin,
  type AdminPrincipal
} from "@/lib/auth/admin";
import { getAuthenticatedDirectusSession } from "@/lib/directus/auth";
import { createDirectusRestClient } from "@/lib/directus/client";
import { logDirectusDiagnostic } from "@/lib/directus/diagnostics";
import type { DirectusSchema } from "@/lib/directus/types";

export const adminUsersPageSize = 20;

export const adminUserStatuses = [
  "active",
  "invited",
  "draft",
  "suspended",
  "archived"
] as const;

export type AdminUserStatus = (typeof adminUserStatuses)[number];

export interface AdminUserListQuery {
  page: number;
  query: string;
  status: AdminUserStatus | null;
}

export interface AdminUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountNumber: string | null;
  status: AdminUserStatus | null;
  lastAccess: string | null;
  role: "websiteUser";
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
  | {
      state: "ready";
      user: AdminUserSummary;
    }
  | {
      state: "notFound";
    }
  | {
      state: "unavailable";
    };

/*
 * Task 4B.1
 *
 * For this task an admin can only perform:
 *
 * active -> suspended
 * suspended -> active
 *
 * Other Directus statuses cannot be selected through this mutation.
 */
export const adminUserMutableStatuses = ["active", "suspended"] as const;

export type AdminUserMutableStatus =
  (typeof adminUserMutableStatuses)[number];

export type AdminUserStatusMutationResult =
  | {
      state: "updated";
      status: AdminUserMutableStatus;
    }
  | {
      state: "invalidUserId";
    }
  | {
      state: "invalidStatus";
    }
  | {
      state: "invalidTransition";
    }
  | {
      state: "selfTarget";
    }
  | {
      state: "notFound";
    }
  | {
      state: "unavailable";
    };

const userFields = [
  "id",
  "first_name",
  "last_name",
  "email",
  "status",
  "last_access",
  "role"
] as const;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeDate(value: unknown) {
  const candidate = text(value);

  return candidate && Number.isFinite(Date.parse(candidate))
    ? candidate
    : null;
}

function normalizedStatus(value: unknown): AdminUserStatus | null {
  const candidate = text(value).toLowerCase();

  return adminUserStatuses.includes(candidate as AdminUserStatus)
    ? (candidate as AdminUserStatus)
    : null;
}

function normalizedPage(value: unknown) {
  const candidate =
    typeof value === "string" ? Number(value) : Number.NaN;

  return Number.isSafeInteger(candidate) && candidate > 0
    ? candidate
    : 1;
}

export function normalizeAdminUsersQuery(input: {
  page?: string;
  q?: string;
  status?: string;
}): AdminUserListQuery {
  const status = text(input.status).toLowerCase();

  return {
    page: normalizedPage(input.page),
    query: text(input.q).slice(0, 100),
    status: adminUserStatuses.includes(status as AdminUserStatus)
      ? (status as AdminUserStatus)
      : null
  };
}

function configuredWebsiteUserRoleId() {
  return normalizeDirectusRoleId(
    process.env.DIRECTUS_WEBSITE_USER_ROLE_ID
  );
}

function normalizedCount(result: unknown) {
  if (
    !Array.isArray(result) ||
    !result[0] ||
    typeof result[0] !== "object"
  ) {
    return null;
  }

  const count = (result[0] as { count?: unknown }).count;

  const raw =
    count &&
    typeof count === "object" &&
    "id" in count
      ? (count as { id?: unknown }).id
      : count;

  const value =
    typeof raw === "string" || typeof raw === "number"
      ? Number(raw)
      : Number.NaN;

  return Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

function userFilter(
  roleId: string,
  query: AdminUserListQuery
) {
  const restrictions: Array<Record<string, unknown>> = [
    {
      role: {
        _eq: roleId
      }
    }
  ];

  if (query.status) {
    restrictions.push({
      status: {
        _eq: query.status
      }
    });
  }

  if (query.query) {
    restrictions.push({
      _or: [
        {
          first_name: {
            _icontains: query.query
          }
        },
        {
          last_name: {
            _icontains: query.query
          }
        },
        {
          email: {
            _icontains: query.query
          }
        }
      ]
    });
  }

  return {
    _and: restrictions
  };
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
  roleId: string,
  accountNumber: string | null
): AdminUserSummary | null {
  const id = text(user.id).toLowerCase();
  const email = text(user.email);

  if (
    !uuidPattern.test(id) ||
    !email ||
    normalizeDirectusRoleId(user.role) !== roleId
  ) {
    return null;
  }

  return {
    id,
    firstName: text(user.first_name),
    lastName: text(user.last_name),
    email,
    accountNumber,
    status: normalizedStatus(user.status),
    lastAccess: safeDate(user.last_access),
    role: "websiteUser"
  };
}

type AdminRequest = <Output>(
  command: RestCommand<Output, DirectusSchema>
) => Promise<Output>;

async function safeProfilesRead(
  request: AdminRequest,
  userIds: string[]
) {
  if (userIds.length === 0) {
    return new Map<string, string>();
  }

  try {
    const profiles = await request(
      readItems("user_profiles", {
        fields: ["user", "account_number"],
        filter: {
          user: {
            _in: userIds
          }
        },
        limit: userIds.length
      })
    );

    return new Map(
      profiles.flatMap((profile) => {
        const userId =
          typeof profile.user === "string"
            ? profile.user
            : "";

        const accountNumber = text(
          profile.account_number
        );

        return userId && accountNumber
          ? [
              [
                userId.toLowerCase(),
                accountNumber
              ] as const
            ]
          : [];
      })
    );
  } catch (caught) {
    logDirectusDiagnostic(
      "admin-users.read-profiles",
      caught
    );

    return new Map<string, string>();
  }
}

/*
 * Creates an authenticated Directus request context.
 *
 * requireAdmin() is always used before returning a usable
 * Directus request function.
 *
 * A principal may be supplied by mutations which have
 * already called requireAdmin() themselves.
 */
async function adminRequestContext(
  principal?: AdminPrincipal
) {
  const authorizedPrincipal =
    principal ?? (await requireAdmin());

  const roleId = configuredWebsiteUserRoleId();
  const client = createDirectusRestClient();
  const session =
    await getAuthenticatedDirectusSession();

  if (!roleId || !client || !session) {
    logDirectusDiagnostic(
      "admin-users.configuration",
      new Error(
        "Admin website-user directory is not configured"
      )
    );

    return null;
  }

  return {
    principal: authorizedPrincipal,
    roleId,
    request: <T>(
      command: Parameters<
        typeof client.request<T>
      >[0]
    ) =>
      client.request(
        withToken(session.accessToken, command)
      )
  };
}

export async function getAdminUsers(input: {
  page?: string;
  q?: string;
  status?: string;
}): Promise<AdminUsersResult> {
  noStore();

  const query =
    normalizeAdminUsersQuery(input);

  const context =
    await adminRequestContext();

  if (!context) {
    return {
      state: "unavailable",
      query
    };
  }

  const filter = userFilter(
    context.roleId,
    query
  );

  try {
    const countResult =
      await context.request(
        aggregate("directus_users", {
          aggregate: {
            count: ["id"]
          },
          query: {
            filter
          }
        })
      );

    const totalCount =
      normalizedCount(countResult);

    if (totalCount === null) {
      throw new Error(
        "Directus returned an invalid user count"
      );
    }

    const totalPages = Math.max(
      1,
      Math.ceil(
        totalCount / adminUsersPageSize
      )
    );

    const currentQuery = {
      ...query,
      page: Math.min(
        query.page,
        totalPages
      )
    };

    const users =
      await context.request(
        readUsers({
          fields: userFields,
          filter,
          sort: [
            "first_name",
            "last_name",
            "email"
          ],
          limit: adminUsersPageSize,
          offset:
            (currentQuery.page - 1) *
            adminUsersPageSize
        })
      );

    const profileByUser =
      await safeProfilesRead(
        context.request,
        users
          .map((user) => text(user.id))
          .filter(Boolean)
      );

    const normalizedUsers =
      users.flatMap((user) => {
        const id =
          text(user.id).toLowerCase();

        const normalized =
          normalizeUser(
            user,
            context.roleId,
            profileByUser.get(id) ??
              null
          );

        return normalized
          ? [normalized]
          : [];
      });

    return {
      state: "ready",
      users: normalizedUsers,
      query: currentQuery,
      totalCount,
      totalPages
    };
  } catch (caught) {
    logDirectusDiagnostic(
      "admin-users.read-list",
      caught
    );

    return {
      state: "unavailable",
      query
    };
  }
}

export async function getAdminUserById(
  userId: string
): Promise<AdminUserDetailResult> {
  noStore();

  const context =
    await adminRequestContext();

  if (!context) {
    return {
      state: "unavailable"
    };
  }

  const id =
    text(userId).toLowerCase();

  if (!uuidPattern.test(id)) {
    return {
      state: "notFound"
    };
  }

  try {
    const users =
      await context.request(
        readUsers({
          fields: userFields,
          filter: {
            _and: [
              {
                id: {
                  _eq: id
                }
              },
              {
                role: {
                  _eq:
                    context.roleId
                }
              }
            ]
          },
          limit: 1
        })
      );

    const user = users[0];

    if (!user) {
      return {
        state: "notFound"
      };
    }

    const profileByUser =
      await safeProfilesRead(
        context.request,
        [id]
      );

    const normalized =
      normalizeUser(
        user,
        context.roleId,
        profileByUser.get(id) ?? null
      );

    return normalized
      ? {
          state: "ready",
          user: normalized
        }
      : {
          state: "notFound"
        };
  } catch (caught) {
    logDirectusDiagnostic(
      "admin-users.read-detail",
      caught
    );

    return {
      state: "unavailable"
    };
  }
}

/*
 * Task 4B.1
 *
 * Securely activate or suspend a Website User.
 *
 * Security rules:
 *
 * - The mutation authorizes independently.
 * - Only Website Users can be targeted.
 * - Only active/suspended statuses are accepted.
 * - Current state is read from Directus.
 * - Invalid transitions are rejected.
 * - Admin self-suspension is rejected.
 * - Only the status field is updated.
 */
export async function setAdminUserStatus(
  userId: string,
  newStatus: unknown
): Promise<AdminUserStatusMutationResult> {
  /*
   * IMPORTANT:
   * Do not rely on the admin layout.
   *
   * Every mutation must independently
   * verify administrator authorization.
   */
  const principal = await requireAdmin();

  const context =
    await adminRequestContext(principal);

  if (!context) {
    return {
      state: "unavailable"
    };
  }

  /*
   * Validate target user ID.
   */
  const id =
    text(userId).toLowerCase();

  if (!uuidPattern.test(id)) {
    return {
      state: "invalidUserId"
    };
  }

  /*
   * Never accept an arbitrary Directus
   * status from the client.
   */
  const requestedStatus =
    text(newStatus).toLowerCase();

  if (
    !adminUserMutableStatuses.includes(
      requestedStatus as AdminUserMutableStatus
    )
  ) {
    return {
      state: "invalidStatus"
    };
  }

  const status =
    requestedStatus as AdminUserMutableStatus;

  /*
   * Defense in depth.
   *
   * Never allow an administrator to
   * suspend their own account.
   */
  if (
    id === principal.id &&
    status === "suspended"
  ) {
    return {
      state: "selfTarget"
    };
  }

  try {
    /*
     * Read the actual target user from
     * Directus.
     *
     * Do not trust the browser to provide
     * the user's current status or role.
     */
    const users =
      await context.request(
        readUsers({
          fields: [
            "id",
            "status",
            "role"
          ],
          filter: {
            _and: [
              {
                id: {
                  _eq: id
                }
              },
              {
                role: {
                  _eq:
                    context.roleId
                }
              }
            ]
          },
          limit: 1
        })
      );

    const targetUser = users[0];

    if (!targetUser) {
      return {
        state: "notFound"
      };
    }

    const currentStatus =
      normalizedStatus(
        targetUser.status
      );

    /*
     * Explicit transition rules.
     *
     * active    -> suspended
     * suspended -> active
     */
    const validTransition =
      (currentStatus === "active" &&
        status === "suspended") ||
      (currentStatus === "suspended" &&
        status === "active");

    if (!validTransition) {
      return {
        state: "invalidTransition"
      };
    }

    /*
     * Update ONLY the status field.
     */
    await context.request(
      updateUser(id, {
        status
      })
    );

    return {
      state: "updated",
      status
    };
  } catch (caught) {
    logDirectusDiagnostic(
      "admin-users.update-status",
      caught
    );

    return {
      state: "unavailable"
    };
  }
}