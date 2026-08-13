import { beforeEach, describe, expect, it, vi } from "vitest";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));
vi.mock("@directus/sdk", () => ({
  readItems: (collection: string, query: unknown) => ({ operation: "read", collection, query }),
  createItem: (collection: string, item: unknown) => ({ operation: "create", collection, item }),
  withToken: (_token: string, command: unknown) => command
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
  createCurrentUserTrainingApplication,
  getPublishedTrainingProgramBySlug
} from "@/lib/directus/training";

const application = {
  programId: "program-1",
  phoneCountryCode: "+90",
  phoneNumber: "5525073889",
  message: "Please contact me"
};

describe("Directus training integration", () => {
  beforeEach(() => request.mockReset());

  it("resolves a published program using the server-controlled slug filter", async () => {
    request.mockResolvedValueOnce([{ id: "program-1", slug: "cybersecurity" }]);

    const result = await getPublishedTrainingProgramBySlug("cybersecurity");

    expect(result.ok).toBe(true);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "read",
        collection: "training_programs",
        query: expect.objectContaining({
          filter: {
            slug: { _eq: "cybersecurity" },
            status: { _eq: "published" }
          }
        })
      })
    );
    const query = request.mock.calls[0][0].query;
    expect(query.fields).toEqual(expect.arrayContaining(["id", "slug", "status", "application_open"]));
    expect(query.fields).not.toContain("date_created");
    expect(query.fields).not.toContain("date_updated");
  });

  it("creates an application without user ownership or status fields", async () => {
    request.mockResolvedValueOnce([]).mockResolvedValueOnce({ id: "application-1" });

    await expect(createCurrentUserTrainingApplication(application)).resolves.toEqual({ ok: true });

    const createCommand = request.mock.calls[1][0];
    expect(createCommand).toMatchObject({
      operation: "create",
      collection: "training_applications",
      item: {
        training_program: "program-1",
        phone_country_code: "+90",
        phone_number: "5525073889",
        message: "Please contact me"
      }
    });
    expect(createCommand.item).not.toHaveProperty("user");
    expect(createCommand.item).not.toHaveProperty("status");
    expect(createCommand.item).not.toHaveProperty("id");
  });

  it("does not create a duplicate application for the same program", async () => {
    request.mockResolvedValueOnce([{ id: "existing", status: "under_review" }]);

    await expect(createCurrentUserTrainingApplication(application)).resolves.toEqual({
      ok: false,
      error: "alreadyApplied",
      status: "under_review"
    });
    expect(request).toHaveBeenCalledTimes(1);
  });
});
