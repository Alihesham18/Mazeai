import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, getAuthenticatedSession, notFound, readSession, redirect, request } =
  vi.hoisted(() => ({
    createClient: vi.fn(),
    getAuthenticatedSession: vi.fn(),
    notFound: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
    readSession: vi.fn(),
    redirect: vi.fn(() => {
      throw new Error("NEXT_REDIRECT");
    }),
    request: vi.fn()
  }));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ notFound, redirect }));
vi.mock("@directus/sdk", () => ({
  isDirectusError: (error: unknown) =>
    Boolean(error && typeof error === "object" && "errors" in error),
  readMe: (query: unknown) => ({ operation: "readMe", query }),
  withToken: (token: string, command: unknown) => ({ token, command })
}));
vi.mock("@/lib/directus/auth", () => ({
  getAuthenticatedDirectusSession: getAuthenticatedSession,
  readDirectusSession: readSession
}));
vi.mock("@/lib/directus/client", () => ({ createDirectusRestClient: createClient }));
vi.mock("@/lib/directus/diagnostics", () => ({ logDirectusDiagnostic: vi.fn() }));

import { getAdminAuthorization, normalizeDirectusRoleId, requireAdmin } from "@/lib/auth/admin";

const adminRoleId = "11111111-1111-4111-8111-111111111111";
const websiteRoleId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const session = {
  accessToken: "website-user-access-token",
  refreshToken: "website-user-refresh-token",
  expiresAt: Date.now() + 60_000
};
const previousAdminRoleId = process.env.DIRECTUS_ADMIN_ROLE_ID;

function directusUser(overrides: Record<string, unknown> = {}) {
  return {
    id: userId,
    email: "admin@example.com",
    first_name: "Website",
    last_name: "Admin",
    status: "active",
    role: adminRoleId,
    ...overrides
  };
}

describe("admin authorization", () => {
  afterAll(() => {
    if (previousAdminRoleId === undefined) {
      delete process.env.DIRECTUS_ADMIN_ROLE_ID;
    } else {
      process.env.DIRECTUS_ADMIN_ROLE_ID = previousAdminRoleId;
    }
  });

  beforeEach(() => {
    process.env.DIRECTUS_ADMIN_ROLE_ID = adminRoleId;
    readSession.mockReset().mockReturnValue(session);
    getAuthenticatedSession.mockReset().mockResolvedValue(session);
    request.mockReset().mockResolvedValue(directusUser());
    createClient.mockReset().mockReturnValue({ request });
    redirect.mockClear();
    notFound.mockClear();
  });

  it("redirects an unauthenticated admin page request to localized login with a safe return path", async () => {
    readSession.mockReturnValue(null);

    await expect(requireAdmin({ locale: "fa", destination: "/admin" })).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(redirect).toHaveBeenCalledWith("/fa/login?next=%2Ffa%2Fadmin");
    expect(request).not.toHaveBeenCalled();
  });

  it.each([
    ["normal Website User", websiteRoleId],
    ["wrong role UUID", "44444444-4444-4444-8444-444444444444"],
    ["missing role", null],
    ["malformed role", { id: "not-a-uuid" }]
  ])("denies an authenticated user with %s", async (_label, role) => {
    request.mockResolvedValue(directusUser({ role }));

    await expect(getAdminAuthorization()).resolves.toEqual({
      authorized: false,
      reason: "forbidden"
    });
  });

  it.each(["inactive", "suspended"])("denies an admin whose status is %s", async (status) => {
    request.mockResolvedValue(directusUser({ status }));

    await expect(getAdminAuthorization()).resolves.toEqual({
      authorized: false,
      reason: "forbidden"
    });
  });

  it("fails closed when DIRECTUS_ADMIN_ROLE_ID is missing", async () => {
    delete process.env.DIRECTUS_ADMIN_ROLE_ID;

    await expect(getAdminAuthorization()).resolves.toEqual({
      authorized: false,
      reason: "configuration"
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("fails closed when the authenticated session cannot be refreshed", async () => {
    getAuthenticatedSession.mockResolvedValue(null);

    await expect(getAdminAuthorization()).resolves.toEqual({
      authorized: false,
      reason: "backendFailure"
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("fails closed when the Directus current-user read fails", async () => {
    request.mockRejectedValue(new Error("Directus unavailable"));

    await expect(getAdminAuthorization()).resolves.toEqual({
      authorized: false,
      reason: "backendFailure"
    });
  });

  it("treats Directus denial of the role field as an authenticated non-admin denial", async () => {
    request.mockRejectedValue({
      errors: [
        {
          message: "You do not have permission to access field role",
          extensions: { code: "FORBIDDEN", status: 403 }
        }
      ]
    });

    await expect(getAdminAuthorization()).resolves.toEqual({
      authorized: false,
      reason: "forbidden"
    });
  });

  it("authorizes the configured active role returned as a UUID string", async () => {
    const result = await getAdminAuthorization();

    expect(result).toEqual({
      authorized: true,
      principal: {
        id: userId,
        email: "admin@example.com",
        firstName: "Website",
        lastName: "Admin",
        roleId: adminRoleId
      }
    });
    expect(request).toHaveBeenCalledWith({
      token: "website-user-access-token",
      command: {
        operation: "readMe",
        query: {
          fields: ["id", "email", "first_name", "last_name", "status", "role"]
        }
      }
    });
  });

  it("authorizes the configured active role returned as an object with an id", async () => {
    request.mockResolvedValue(directusUser({ role: { id: adminRoleId, name: "Website Admin" } }));

    await expect(getAdminAuthorization()).resolves.toMatchObject({ authorized: true });
    expect(normalizeDirectusRoleId({ id: adminRoleId })).toBe(adminRoleId);
  });

  it("ignores caller-supplied role values and trusts only the Directus response", async () => {
    request.mockResolvedValue(directusUser({ role: websiteRoleId }));

    const result = await (getAdminAuthorization as unknown as (input: unknown) => Promise<unknown>)(
      {
        role: adminRoleId,
        isAdmin: true,
        accountNumber: "SMA-2026-000001"
      }
    );

    expect(result).toEqual({ authorized: false, reason: "forbidden" });
  });

  it("uses not-found rather than login for an authenticated non-admin page request", async () => {
    request.mockResolvedValue(directusUser({ role: websiteRoleId }));

    await expect(requireAdmin({ locale: "en" })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
    expect(redirect).not.toHaveBeenCalled();
  });
});
