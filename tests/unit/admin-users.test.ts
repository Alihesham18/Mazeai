import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClient,
  getSession,
  logDiagnostic,
  noStore,
  recordActivity,
  request,
  requestPasswordReset,
  requireAdmin
} = vi.hoisted(() => ({
  createClient: vi.fn(),
  getSession: vi.fn(),
  logDiagnostic: vi.fn(),
  noStore: vi.fn(),
  recordActivity: vi.fn(),
  request: vi.fn(),
  requestPasswordReset: vi.fn(),
  requireAdmin: vi.fn()
}));

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
  readUsers: (query: unknown) => ({ operation: "readUsers", query }),
  updateUser: (id: string, changes: unknown) => ({ operation: "updateUser", id, changes }),
  withToken: (token: string, command: unknown) => ({ token, command })
}));
vi.mock("@/lib/auth/admin", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/admin")>("@/lib/auth/admin");
  return { ...actual, requireAdmin };
});
vi.mock("@/lib/directus/admin-activity", () => ({
  recordAdminUserActivity: recordActivity
}));
vi.mock("@/lib/directus/auth", () => ({
  getAuthenticatedDirectusSession: getSession,
  requestDirectusPasswordReset: requestPasswordReset
}));
vi.mock("@/lib/directus/client", () => ({ createDirectusRestClient: createClient }));
vi.mock("@/lib/directus/diagnostics", () => ({ logDirectusDiagnostic: logDiagnostic }));

import {
  getAdminUserById,
  getAdminUsers,
  normalizeAdminUsersQuery,
  requestAdminUserPasswordReset,
  setAdminUserRole,
  setAdminUserStatus
} from "@/lib/directus/admin-users";

const websiteRoleId = "11111111-1111-4111-8111-111111111111";
const adminRoleId = "55555555-5555-4555-8555-555555555555";
const serviceRoleId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const serviceUserId = "44444444-4444-4444-8444-444444444444";
const previousWebsiteRoleId = process.env.DIRECTUS_WEBSITE_USER_ROLE_ID;
const previousAdminRoleId = process.env.DIRECTUS_ADMIN_ROLE_ID;
const previousManagementToken = process.env.DIRECTUS_USER_MANAGEMENT_TOKEN;

type Command = {
  token: string;
  command: {
    operation: "aggregate" | "readItems" | "readUsers" | "updateUser";
    collection?: string;
    id?: string;
    changes?: Record<string, unknown>;
    options?: unknown;
    query?: Record<string, unknown>;
  };
};

const websiteUser = {
  id: userId,
  first_name: "Ali",
  last_name: "Example",
  email: "ali@example.com",
  status: "active",
  last_access: "2026-08-19T09:00:00Z",
  role: websiteRoleId,
  password: "must-never-be-returned",
  token: "must-never-be-returned"
};

function successfulResponse(input: Command) {
  const command = input.command;
  if (command.operation === "aggregate") return [{ count: { id: "21" } }];
  if (command.operation === "readItems") {
    return [{ user: userId, account_number: "SMA-2026-000001" }];
  }
  if (command.operation === "updateUser") return { id: userId, status: "suspended" };
  return [websiteUser];
}

function requestFor(operation: Command["command"]["operation"]) {
  return request.mock.calls
    .map((call) => call[0] as Command)
    .find((input) => input.command.operation === operation);
}

describe("admin user directory service", () => {
  afterAll(() => {
    if (previousWebsiteRoleId === undefined) delete process.env.DIRECTUS_WEBSITE_USER_ROLE_ID;
    else process.env.DIRECTUS_WEBSITE_USER_ROLE_ID = previousWebsiteRoleId;
    if (previousAdminRoleId === undefined) delete process.env.DIRECTUS_ADMIN_ROLE_ID;
    else process.env.DIRECTUS_ADMIN_ROLE_ID = previousAdminRoleId;
    if (previousManagementToken === undefined) delete process.env.DIRECTUS_USER_MANAGEMENT_TOKEN;
    else process.env.DIRECTUS_USER_MANAGEMENT_TOKEN = previousManagementToken;
  });

  beforeEach(() => {
    process.env.DIRECTUS_WEBSITE_USER_ROLE_ID = websiteRoleId;
    process.env.DIRECTUS_ADMIN_ROLE_ID = adminRoleId;
    process.env.DIRECTUS_USER_MANAGEMENT_TOKEN = "user-management-service-token";
    requireAdmin.mockReset().mockResolvedValue({
      id: "admin-id",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      roleId: "admin-role-id"
    });
    getSession.mockReset().mockResolvedValue({
      accessToken: "website-admin-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 60_000
    });
    request.mockReset().mockImplementation(successfulResponse);
    createClient.mockReset().mockReturnValue({ request });
    recordActivity.mockReset().mockResolvedValue(true);
    requestPasswordReset.mockReset().mockResolvedValue({ ok: true });
    logDiagnostic.mockClear();
    noStore.mockClear();
  });

  it("returns a normalized paginated website-user list with batched account numbers", async () => {
    const result = await getAdminUsers({ page: "1" });

    expect(result).toEqual({
      state: "ready",
      users: [
        {
          id: userId,
          firstName: "Ali",
          lastName: "Example",
          email: "ali@example.com",
          accountNumber: "SMA-2026-000001",
          status: "active",
          lastAccess: "2026-08-19T09:00:00Z",
          role: "websiteUser"
        }
      ],
      query: { page: 1, query: "", status: null, role: null },
      totalCount: 21,
      totalPages: 2
    });
    expect(requireAdmin).toHaveBeenCalledWith();
    expect(noStore).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(result)).not.toContain("must-never-be-returned");
    expect(JSON.stringify(result)).not.toContain("website-admin-access-token");
  });

  it("applies role scoping, server-side search, status filtering, and pagination", async () => {
    await getAdminUsers({ page: "2", q: "  ali  ", status: "ACTIVE" });

    const aggregateCall = requestFor("aggregate") as Command;
    const usersCall = requestFor("readUsers") as Command;
    expect(aggregateCall.token).toBe("website-admin-access-token");
    expect(aggregateCall.command.options).toEqual({
      aggregate: { count: ["id"] },
      query: {
        filter: {
          _and: [
            { role: { _in: [websiteRoleId, adminRoleId] } },
            { status: { _eq: "active" } },
            {
              _or: [
                { first_name: { _icontains: "ali" } },
                { last_name: { _icontains: "ali" } },
                { email: { _icontains: "ali" } }
              ]
            }
          ]
        }
      }
    });
    expect(usersCall.command.query).toMatchObject({ limit: 20, offset: 20 });
  });

  it("normalizes invalid pages, statuses, and application role values safely", () => {
    expect(
      normalizeAdminUsersQuery({
        page: "-7",
        q: " test ",
        status: "deleted",
        role: adminRoleId
      })
    ).toEqual({
      page: 1,
      query: "test",
      status: null,
      role: null
    });
    expect(normalizeAdminUsersQuery({ role: "websiteAdmin" }).role).toBe("websiteAdmin");
  });

  it("filters the directory by a normalized managed role without exposing its UUID", async () => {
    await getAdminUsers({ role: "websiteAdmin" });

    const aggregateCall = requestFor("aggregate") as Command;
    expect(aggregateCall.command.options).toEqual({
      aggregate: { count: ["id"] },
      query: { filter: { _and: [{ role: { _in: [adminRoleId] } }] } }
    });
  });

  it("clamps an out-of-range page after reading the total count", async () => {
    const result = await getAdminUsers({ page: "99" });

    expect(result).toMatchObject({ state: "ready", query: { page: 2 }, totalPages: 2 });
    const usersCall = requestFor("readUsers") as Command;
    expect(usersCall.command.query).toMatchObject({ offset: 20 });
  });

  it("defensively excludes a service account even if Directus returns it", async () => {
    request.mockImplementation((input: Command) => {
      if (input.command.operation === "readUsers") {
        return [
          websiteUser,
          {
            ...websiteUser,
            id: serviceUserId,
            email: "discount-service@example.com",
            role: serviceRoleId
          }
        ];
      }
      return successfulResponse(input);
    });

    const result = await getAdminUsers({});

    expect(result.state).toBe("ready");
    if (result.state === "ready") {
      expect(result.users.map((user) => user.email)).toEqual(["ali@example.com"]);
    }
  });

  it("uses an allowlist of safe Directus user fields", async () => {
    await getAdminUsers({});

    const usersCall = requestFor("readUsers") as Command;
    expect(usersCall.command.query?.fields).toEqual([
      "id",
      "first_name",
      "last_name",
      "email",
      "status",
      "last_access",
      "role"
    ]);
    expect(usersCall.command.query?.fields).not.toContain("password");
    expect(usersCall.command.query?.fields).not.toContain("token");
    expect(usersCall.command.query?.fields).not.toContain("auth_data");
  });

  it("returns a safely normalized user detail with its account number", async () => {
    await expect(getAdminUserById(userId)).resolves.toEqual({
      state: "ready",
      user: expect.objectContaining({
        id: userId,
        email: "ali@example.com",
        accountNumber: "SMA-2026-000001",
        role: "websiteUser"
      })
    });
  });

  it("rejects invalid UUIDs without issuing a Directus data request", async () => {
    await expect(getAdminUserById("not-a-uuid")).resolves.toEqual({ state: "notFound" });
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(request).not.toHaveBeenCalled();
  });

  it("returns notFound for inaccessible or service-account details", async () => {
    request.mockImplementation((input: Command) =>
      input.command.operation === "readUsers"
        ? [{ ...websiteUser, role: serviceRoleId }]
        : successfulResponse(input)
    );

    await expect(getAdminUserById(userId)).resolves.toEqual({ state: "notFound" });
  });

  it("isolates a profile permission failure from the safe user list", async () => {
    request.mockImplementation((input: Command) => {
      if (input.command.operation === "readItems") throw new Error("Profile read denied");
      return successfulResponse(input);
    });

    const result = await getAdminUsers({});

    expect(result).toMatchObject({
      state: "ready",
      users: [{ email: "ali@example.com", accountNumber: null }]
    });
    expect(logDiagnostic).toHaveBeenCalledWith("admin-users.read-profiles", expect.any(Error));
  });

  it("returns a safe unavailable state when the Directus user read fails", async () => {
    request.mockRejectedValue(new Error("private Directus detail"));

    await expect(getAdminUsers({ q: "ali" })).resolves.toEqual({
      state: "unavailable",
      query: { page: 1, query: "ali", status: null, role: null }
    });
    expect(logDiagnostic).toHaveBeenCalledWith("admin-users.read-list", expect.any(Error));
  });

  it("fails closed before data reads when requireAdmin rejects a normal user", async () => {
    requireAdmin.mockRejectedValue(new Error("Admin authorization failed"));

    await expect(getAdminUsers({})).rejects.toThrow("Admin authorization failed");
    expect(request).not.toHaveBeenCalled();
  });

  describe("account status mutation", () => {
    it("independently authorizes, scopes the target role, and updates only status", async () => {
      const result = await setAdminUserStatus(userId, "suspended");

      expect(result).toEqual({
        state: "updated",
        status: "suspended"
      });

      expect(requireAdmin).toHaveBeenCalledTimes(1);
      const readCall = requestFor("readUsers") as Command;
      expect(readCall.command.query).toEqual({
        fields: ["id", "email", "status", "role"],
        filter: {
          _and: [{ id: { _eq: userId } }, { role: { _eq: websiteRoleId } }]
        },
        limit: 1
      });

      const updateCall = requestFor("updateUser") as Command;
      expect(updateCall.command).toEqual({
        operation: "updateUser",
        id: userId,
        changes: { status: "suspended" }
      });
      expect(recordActivity).toHaveBeenCalledWith({
        action: "user.suspended",
        administrator: expect.objectContaining({ email: "admin@example.com" }),
        targetUserId: userId,
        targetEmail: "ali@example.com",
        previousValue: "active",
        newValue: "suspended"
      });
      expect(JSON.stringify(result)).not.toContain("website-admin-access-token");
    });

    it("accepts the reverse suspended-to-active transition", async () => {
      request.mockImplementation((input: Command) => {
        if (input.command.operation === "readUsers") {
          return [{ ...websiteUser, status: "suspended" }];
        }
        return successfulResponse(input);
      });

      await expect(setAdminUserStatus(userId, "active")).resolves.toEqual({
        state: "updated",
        status: "active"
      });
      expect((requestFor("updateUser") as Command).command.changes).toEqual({ status: "active" });
      expect(recordActivity).toHaveBeenCalledWith(
        expect.objectContaining({ action: "user.activated", previousValue: "suspended" })
      );
    });

    it("rejects malformed target IDs and unsupported statuses before data requests", async () => {
      await expect(setAdminUserStatus("not-a-uuid", "suspended")).resolves.toEqual({
        state: "invalidUserId"
      });
      expect(request).not.toHaveBeenCalled();

      await expect(setAdminUserStatus(userId, "archived")).resolves.toEqual({
        state: "invalidStatus"
      });
      expect(request).not.toHaveBeenCalled();
    });

    it("prevents an administrator from suspending their own account", async () => {
      requireAdmin.mockResolvedValue({
        id: userId,
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        roleId: "admin-role-id"
      });

      await expect(setAdminUserStatus(userId, "suspended")).resolves.toEqual({
        state: "selfTarget"
      });
      expect(request).not.toHaveBeenCalled();
    });

    it("rejects missing targets and invalid transitions without issuing an update", async () => {
      request.mockResolvedValueOnce([]);
      await expect(setAdminUserStatus(userId, "suspended")).resolves.toEqual({
        state: "notFound"
      });
      expect(requestFor("updateUser")).toBeUndefined();

      request.mockReset().mockImplementation(successfulResponse);
      await expect(setAdminUserStatus(userId, "active")).resolves.toEqual({
        state: "invalidTransition"
      });
      expect(requestFor("updateUser")).toBeUndefined();
    });

    it("fails closed if independent admin authorization rejects", async () => {
      requireAdmin.mockRejectedValue(new Error("Admin authorization failed"));

      await expect(setAdminUserStatus(userId, "suspended")).rejects.toThrow(
        "Admin authorization failed"
      );
      expect(request).not.toHaveBeenCalled();
    });

    it("returns a safe unavailable state when the Directus update fails", async () => {
      request.mockImplementation((input: Command) => {
        if (input.command.operation === "updateUser") {
          throw new Error("private Directus update response");
        }
        return successfulResponse(input);
      });

      await expect(setAdminUserStatus(userId, "suspended")).resolves.toEqual({
        state: "unavailable"
      });
      expect(logDiagnostic).toHaveBeenCalledWith("admin-users.update-status", expect.any(Error));
    });
  });

  describe("access role mutation", () => {
    it("promotes a Website User with the server-mapped role and records an audit event", async () => {
      const result = await setAdminUserRole(userId, "websiteAdmin");

      expect(result).toEqual({ state: "updated", role: "websiteAdmin" });
      expect(requireAdmin).toHaveBeenCalledTimes(1);
      const readCall = requestFor("readUsers") as Command;
      expect(readCall.token).toBe("user-management-service-token");
      expect(readCall.command.query).toEqual({
        fields: ["id", "email", "status", "role"],
        filter: {
          _and: [{ id: { _eq: userId } }, { role: { _in: [websiteRoleId, adminRoleId] } }]
        },
        limit: 1
      });
      expect((requestFor("updateUser") as Command).command.changes).toEqual({
        role: adminRoleId
      });
      expect(recordActivity).toHaveBeenCalledWith({
        action: "user.role_changed",
        administrator: expect.objectContaining({ email: "admin@example.com" }),
        targetUserId: userId,
        targetEmail: "ali@example.com",
        previousValue: "websiteUser",
        newValue: "websiteAdmin"
      });
      expect(JSON.stringify(result)).not.toContain(adminRoleId);
      expect(JSON.stringify(result)).not.toContain("service-token");
    });

    it("demotes a Website Admin only after another active admin is verified", async () => {
      request.mockImplementation((input: Command) => {
        if (input.command.operation === "readUsers") {
          return [{ ...websiteUser, role: adminRoleId }];
        }
        if (input.command.operation === "aggregate") return [{ count: { id: "1" } }];
        return successfulResponse(input);
      });

      await expect(setAdminUserRole(userId, "websiteUser")).resolves.toEqual({
        state: "updated",
        role: "websiteUser"
      });
      const aggregateCall = requestFor("aggregate") as Command;
      expect(aggregateCall.command.options).toEqual({
        aggregate: { count: ["id"] },
        query: {
          filter: {
            _and: [
              { role: { _eq: adminRoleId } },
              { status: { _eq: "active" } },
              { id: { _neq: userId } }
            ]
          }
        }
      });
      expect((requestFor("updateUser") as Command).command.changes).toEqual({
        role: websiteRoleId
      });
    });

    it("rejects unknown roles, raw UUID roles, and malformed target IDs", async () => {
      await expect(setAdminUserRole(userId, "serviceAccount")).resolves.toEqual({
        state: "invalidRole"
      });
      await expect(setAdminUserRole(userId, adminRoleId)).resolves.toEqual({
        state: "invalidRole"
      });
      await expect(setAdminUserRole("not-a-uuid", "websiteAdmin")).resolves.toEqual({
        state: "invalidUserId"
      });
      expect(request).not.toHaveBeenCalled();
    });

    it("rejects self-demotion before using the management service", async () => {
      requireAdmin.mockResolvedValue({
        id: userId,
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        roleId: adminRoleId
      });

      await expect(setAdminUserRole(userId, "websiteUser")).resolves.toEqual({
        state: "selfTarget"
      });
      expect(request).not.toHaveBeenCalled();
    });

    it("fails closed when demotion would remove the last active Website Admin", async () => {
      request.mockImplementation((input: Command) => {
        if (input.command.operation === "readUsers") {
          return [{ ...websiteUser, role: adminRoleId }];
        }
        if (input.command.operation === "aggregate") return [{ count: { id: "0" } }];
        return successfulResponse(input);
      });

      await expect(setAdminUserRole(userId, "websiteUser")).resolves.toEqual({
        state: "lastAdmin"
      });
      expect(requestFor("updateUser")).toBeUndefined();
      expect(recordActivity).not.toHaveBeenCalled();
    });

    it("loads the current role server-side and rejects missing or stale transitions", async () => {
      request.mockResolvedValueOnce([]);
      await expect(setAdminUserRole(userId, "websiteAdmin")).resolves.toEqual({
        state: "notFound"
      });

      request.mockReset().mockImplementation(successfulResponse);
      await expect(setAdminUserRole(userId, "websiteUser")).resolves.toEqual({
        state: "invalidTransition"
      });
      expect(requestFor("updateUser")).toBeUndefined();
    });

    it.each(["normal Website User", "unauthenticated user"])(
      "blocks a %s through independent authorization",
      async () => {
        requireAdmin.mockRejectedValue(new Error("Admin authorization failed"));

        await expect(setAdminUserRole(userId, "websiteAdmin")).rejects.toThrow(
          "Admin authorization failed"
        );
        expect(request).not.toHaveBeenCalled();
      }
    );
  });

  describe("administrator password reset request", () => {
    it("loads the target email server-side and returns no reset or session tokens", async () => {
      const result = await requestAdminUserPasswordReset(userId, "tr");

      expect(result).toEqual({ state: "sent" });
      expect(requireAdmin).toHaveBeenCalledTimes(1);
      expect((requestFor("readUsers") as Command).command.query).toEqual({
        fields: ["id", "email", "role"],
        filter: {
          _and: [{ id: { _eq: userId } }, { role: { _in: [websiteRoleId, adminRoleId] } }]
        },
        limit: 1
      });
      expect(requestPasswordReset).toHaveBeenCalledWith(
        "ali@example.com",
        "https://synergymazeai.com/tr/auth/callback?next=/tr/update-password"
      );
      expect(recordActivity).toHaveBeenCalledWith({
        action: "user.password_reset_requested",
        administrator: expect.objectContaining({ email: "admin@example.com" }),
        targetUserId: userId,
        targetEmail: "ali@example.com"
      });
      expect(JSON.stringify(result)).not.toMatch(/token|password|email|role/i);
    });

    it("rejects malformed targets and locales before reading user data", async () => {
      await expect(requestAdminUserPasswordReset("not-a-uuid", "en")).resolves.toEqual({
        state: "invalidUserId"
      });
      await expect(requestAdminUserPasswordReset(userId, "unsafe-locale")).resolves.toEqual({
        state: "invalidLocale"
      });
      expect(request).not.toHaveBeenCalled();
      expect(requestPasswordReset).not.toHaveBeenCalled();
    });

    it("rejects targets outside managed roles and provider failures safely", async () => {
      request.mockResolvedValueOnce([{ ...websiteUser, role: serviceRoleId }]);
      await expect(requestAdminUserPasswordReset(userId, "en")).resolves.toEqual({
        state: "notFound"
      });
      expect(requestPasswordReset).not.toHaveBeenCalled();

      request.mockReset().mockImplementation(successfulResponse);
      requestPasswordReset.mockResolvedValue({ ok: false, error: "RATE_LIMITED" });
      await expect(requestAdminUserPasswordReset(userId, "en")).resolves.toEqual({
        state: "unavailable"
      });
      expect(logDiagnostic).toHaveBeenCalledWith(
        "admin-users.password-reset-request",
        expect.any(Error)
      );
      expect(recordActivity).not.toHaveBeenCalled();
    });

    it.each(["normal Website User", "unauthenticated user"])(
      "blocks a %s through independent authorization",
      async () => {
        requireAdmin.mockRejectedValue(new Error("Admin authorization failed"));

        await expect(requestAdminUserPasswordReset(userId, "en")).rejects.toThrow(
          "Admin authorization failed"
        );
        expect(request).not.toHaveBeenCalled();
        expect(requestPasswordReset).not.toHaveBeenCalled();
      }
    );
  });
});
