import { beforeEach, describe, expect, it, vi } from "vitest";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@directus/sdk", () => ({
  createItem: (collection: string, item: unknown) => ({ operation: "create", collection, item }),
  readItems: (collection: string, query: unknown) => ({ operation: "read", collection, query }),
  updateItem: (collection: string, id: string, item: unknown) => ({
    operation: "update",
    collection,
    id,
    item
  }),
  withToken: (_token: string, command: unknown) => command,
  isDirectusError: (error: unknown) =>
    Boolean(error && typeof error === "object" && "errors" in error)
}));

vi.mock("@/lib/directus/client", () => ({
  createDirectusRestClient: () => ({ request })
}));

vi.mock("@/lib/directus/auth", () => ({
  getAuthenticatedDirectusSession: vi.fn(async () => ({
    accessToken: "server-only-token",
    refreshToken: "refresh-token",
    expiresAt: Date.now() + 60_000
  })),
  directusAuthErrorCode: vi.fn(() => "serverFailure")
}));

import {
  getCurrentUserDirectusProfile,
  upsertCurrentUserDirectusProfile
} from "@/lib/directus/profile";

const phone = { phone_country_code: "+90", phone_number: "5525073889" };

describe("Directus user profile persistence", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("treats a missing profile as a normal state", async () => {
    request.mockResolvedValueOnce([]);

    await expect(getCurrentUserDirectusProfile()).resolves.toEqual({ ok: true, profile: null });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ operation: "read", collection: "user_profiles" })
    );
  });

  it("creates phone data without accepting or sending profile ownership", async () => {
    request.mockResolvedValueOnce([]).mockResolvedValueOnce({ id: "profile-1", ...phone });

    await expect(upsertCurrentUserDirectusProfile(phone)).resolves.toEqual({ ok: true });
    expect(request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ operation: "create", item: phone })
    );
    expect(request.mock.calls[1][0].item).not.toHaveProperty("user");
  });

  it("updates the profile ID obtained from the policy-scoped read", async () => {
    request.mockResolvedValueOnce([{ id: "profile-1", ...phone }]).mockResolvedValueOnce({});

    await expect(upsertCurrentUserDirectusProfile(phone)).resolves.toEqual({ ok: true });
    expect(request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ operation: "update", id: "profile-1", item: phone })
    );
  });

  it("re-reads and updates when profile creation loses a uniqueness race", async () => {
    request
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce({
        errors: [{ message: "Value must be unique", extensions: { code: "RECORD_NOT_UNIQUE" } }]
      })
      .mockResolvedValueOnce([{ id: "raced-profile", ...phone }])
      .mockResolvedValueOnce({});

    await expect(upsertCurrentUserDirectusProfile(phone)).resolves.toEqual({ ok: true });
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({ operation: "update", id: "raced-profile", item: phone })
    );
  });
});
