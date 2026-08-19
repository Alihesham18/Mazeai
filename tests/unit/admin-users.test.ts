import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

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
  readUsers: (query: unknown) => ({ operation: "readUsers", query }),
  withToken: (token: string, command: unknown) => ({ token, command })
}));
vi.mock("@/lib/auth/admin", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/admin")>("@/lib/auth/admin");
  return { ...actual, requireAdmin };
});
vi.mock("@/lib/directus/auth", () => ({ getAuthenticatedDirectusSession: getSession }));
vi.mock("@/lib/directus/client", () => ({ createDirectusRestClient: createClient }));
vi.mock("@/lib/directus/diagnostics", () => ({ logDirectusDiagnostic: logDiagnostic }));

import {
  getAdminUserById,
  getAdminUsers,
  normalizeAdminUsersQuery
} from "@/lib/directus/admin-users";

const websiteRoleId = "11111111-1111-4111-8111-111111111111";
const serviceRoleId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const serviceUserId = "44444444-4444-4444-8444-444444444444";
const previousWebsiteRoleId = process.env.DIRECTUS_WEBSITE_USER_ROLE_ID;

type Command = {
  token: string;
  command: {
    operation: "aggregate" | "readItems" | "readUsers";
    collection?: string;
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
  });

  beforeEach(() => {
    process.env.DIRECTUS_WEBSITE_USER_ROLE_ID = websiteRoleId;
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
      query: { page: 1, query: "", status: null },
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
            { role: { _eq: websiteRoleId } },
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

  it("normalizes invalid pages and unsupported status values safely", () => {
    expect(normalizeAdminUsersQuery({ page: "-7", q: " test ", status: "deleted" })).toEqual({
      page: 1,
      query: "test",
      status: null
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
      query: { page: 1, query: "ali", status: null }
    });
    expect(logDiagnostic).toHaveBeenCalledWith("admin-users.read-list", expect.any(Error));
  });

  it("fails closed before data reads when requireAdmin rejects a normal user", async () => {
    requireAdmin.mockRejectedValue(new Error("Admin authorization failed"));

    await expect(getAdminUsers({})).rejects.toThrow("Admin authorization failed");
    expect(request).not.toHaveBeenCalled();
  });
});
