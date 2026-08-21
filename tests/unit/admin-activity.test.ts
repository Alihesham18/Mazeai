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
  createItem: (collection: string, item: unknown) => ({
    operation: "createItem",
    collection,
    item
  }),
  readUsers: (query: unknown) => ({ operation: "readUsers", query }),
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

import { getAdminUserActivity, recordAdminUserActivity } from "@/lib/directus/admin-activity";

const administratorId = "11111111-1111-4111-8111-111111111111";
const targetUserId = "22222222-2222-4222-8222-222222222222";
const activityId = "33333333-3333-4333-8333-333333333333";
const websiteRoleId = "44444444-4444-4444-8444-444444444444";
const adminRoleId = "55555555-5555-4555-8555-555555555555";
const previousToken = process.env.DIRECTUS_USER_MANAGEMENT_TOKEN;
const previousWebsiteRoleId = process.env.DIRECTUS_WEBSITE_USER_ROLE_ID;
const previousAdminRoleId = process.env.DIRECTUS_ADMIN_ROLE_ID;

describe("admin user activity service", () => {
  afterAll(() => {
    if (previousToken === undefined) delete process.env.DIRECTUS_USER_MANAGEMENT_TOKEN;
    else process.env.DIRECTUS_USER_MANAGEMENT_TOKEN = previousToken;
    if (previousWebsiteRoleId === undefined) delete process.env.DIRECTUS_WEBSITE_USER_ROLE_ID;
    else process.env.DIRECTUS_WEBSITE_USER_ROLE_ID = previousWebsiteRoleId;
    if (previousAdminRoleId === undefined) delete process.env.DIRECTUS_ADMIN_ROLE_ID;
    else process.env.DIRECTUS_ADMIN_ROLE_ID = previousAdminRoleId;
  });

  beforeEach(() => {
    process.env.DIRECTUS_USER_MANAGEMENT_TOKEN = "management-service-token";
    process.env.DIRECTUS_WEBSITE_USER_ROLE_ID = websiteRoleId;
    process.env.DIRECTUS_ADMIN_ROLE_ID = adminRoleId;
    requireAdmin.mockReset().mockResolvedValue({ id: administratorId });
    getSession.mockReset().mockResolvedValue({ accessToken: "admin-session-token" });
    request.mockReset().mockImplementation((input) => {
      const command = input.command ?? input;
      if (command.operation === "readUsers") {
        return [
          { id: administratorId, email: "admin@example.com", role: adminRoleId },
          { id: targetUserId, email: "target@example.com", role: websiteRoleId }
        ];
      }
      return { id: activityId };
    });
    createClient.mockReset().mockReturnValue({ request });
    logDiagnostic.mockReset();
    noStore.mockReset();
  });

  it("writes an allowlisted audit event containing safe metadata only", async () => {
    await expect(
      recordAdminUserActivity({
        action: "user.role_changed",
        administrator: {
          id: administratorId,
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          roleId: "private-role-id"
        },
        targetUserId,
        targetEmail: "target@example.com",
        previousValue: "websiteUser",
        newValue: "websiteAdmin"
      })
    ).resolves.toBe(true);

    expect(request.mock.calls[0][0]).toEqual({
      token: "management-service-token",
      command: {
        operation: "readUsers",
        query: {
          fields: ["id", "email", "role"],
          filter: {
            _and: [
              { id: { _in: [administratorId, targetUserId] } },
              { role: { _in: [websiteRoleId, adminRoleId] } }
            ]
          },
          limit: 2
        }
      }
    });
    const call = request.mock.calls[1][0];
    expect(call).toEqual({
      token: "management-service-token",
      command: {
        operation: "createItem",
        collection: "admin_activity",
        item: {
          action: "user.role_changed",
          administrator: administratorId,
          administrator_email: "admin@example.com",
          target_user: targetUserId,
          target_email: "target@example.com",
          previous_value: "websiteUser",
          new_value: "websiteAdmin"
        }
      }
    });
    expect(JSON.stringify(call.command.item)).not.toMatch(
      /password|reset.?token|access.?token|refresh.?token|cookie|private-role-id/i
    );
  });

  it("returns a safe normalized activity history to an authorized admin", async () => {
    request.mockResolvedValue([
      {
        id: activityId,
        action: "user.suspended",
        administrator: { id: administratorId },
        administrator_email: "admin@example.com",
        target_user: targetUserId,
        target_email: "target@example.com",
        previous_value: "active",
        new_value: "suspended",
        date_created: "2026-08-20T10:00:00Z",
        password: "must-not-be-returned"
      },
      { id: "malformed", action: "user.suspended" }
    ]);

    await expect(getAdminUserActivity()).resolves.toEqual({
      state: "ready",
      entries: [
        {
          id: activityId,
          action: "user.suspended",
          administratorId,
          administratorEmail: "admin@example.com",
          targetUserId,
          targetEmail: "target@example.com",
          previousValue: "active",
          newValue: "suspended",
          dateCreated: "2026-08-20T10:00:00Z"
        }
      ]
    });
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(noStore).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toMatchObject({ token: "admin-session-token" });
  });

  it.each(["normal Website User", "unauthenticated user"])(
    "blocks a %s from activity history before Directus access",
    async () => {
      requireAdmin.mockRejectedValue(new Error("Admin authorization failed"));

      await expect(getAdminUserActivity()).rejects.toThrow("Admin authorization failed");
      expect(request).not.toHaveBeenCalled();
    }
  );

  it("uses best-effort audit writes and records a safe diagnostic on failure", async () => {
    request.mockRejectedValue(new Error("private backend failure"));

    await expect(
      recordAdminUserActivity({
        action: "user.password_reset_requested",
        administrator: {
          id: administratorId,
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          roleId: "admin-role-id"
        },
        targetUserId,
        targetEmail: "target@example.com"
      })
    ).resolves.toBe(false);
    expect(logDiagnostic).toHaveBeenCalledWith("admin-activity.write", expect.any(Error));
  });

  it("fails closed when either relation is not a server-validated managed identity", async () => {
    request.mockResolvedValueOnce([
      { id: administratorId, email: "admin@example.com", role: adminRoleId }
    ]);

    await expect(
      recordAdminUserActivity({
        action: "user.suspended",
        administrator: {
          id: administratorId,
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          roleId: adminRoleId
        },
        targetUserId,
        targetEmail: "target@example.com",
        previousValue: "active",
        newValue: "suspended"
      })
    ).resolves.toBe(false);

    expect(request).toHaveBeenCalledTimes(1);
    expect(logDiagnostic).toHaveBeenCalledWith("admin-activity.write", expect.any(Error));
  });
});
