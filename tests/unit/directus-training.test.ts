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
  getCurrentDirectusUser: vi.fn(async () => ({ id: "current-user-uuid" })),
  directusAuthErrorCode: vi.fn(() => "serverFailure")
}));

import {
  createCurrentUserTrainingApplication,
  getCurrentUserAcceptedTrainingApplications,
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

  it("loads only accepted applications owned by the authenticated Directus user", async () => {
    request.mockResolvedValueOnce([]);

    await expect(getCurrentUserAcceptedTrainingApplications()).resolves.toEqual({
      ok: true,
      data: []
    });

    const query = request.mock.calls[0][0].query;
    expect(request.mock.calls[0][0]).toMatchObject({
      operation: "read",
      collection: "training_applications"
    });
    expect(query.filter).toEqual({
      user: { _eq: "current-user-uuid" },
      status: { _eq: "accepted" }
    });
    expect(query.fields).toEqual([
      "id",
      "status",
      "date_created",
      {
        training_program: [
          "id",
          "slug",
          "title",
          "category",
          "format",
          "duration_hours",
          "fee",
          "location",
          "certificate_available",
          "instructor_name",
          "instructor_role",
          "short_description",
          "image_url",
          "application_open",
          "status"
        ]
      }
    ]);
  });

  it("does not return submitted, under-review, or rejected applications", async () => {
    const program = {
      id: "program-1",
      slug: "ai-foundations",
      title: "AI Foundations"
    };
    request.mockResolvedValueOnce([
      { id: "submitted", status: "submitted", date_created: null, training_program: program },
      { id: "review", status: "under_review", date_created: null, training_program: program },
      { id: "rejected", status: "rejected", date_created: null, training_program: program },
      { id: "accepted", status: "accepted", date_created: null, training_program: program }
    ]);

    const result = await getCurrentUserAcceptedTrainingApplications();

    expect(result.ok && result.data).toHaveLength(1);
    expect(result.ok && result.data[0]).toMatchObject({
      applicationId: "accepted",
      status: "accepted",
      program: { id: "program-1" }
    });
  });
});
