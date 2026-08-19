import { beforeEach, describe, expect, it, vi } from "vitest";

const { request, withToken } = vi.hoisted(() => ({
  request: vi.fn(),
  withToken: vi.fn((_token: string, command: unknown) => command)
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));
vi.mock("@directus/sdk", () => ({
  isDirectusError: (error: unknown) =>
    Boolean(error && typeof error === "object" && "errors" in error),
  readItems: (collection: string, query: unknown) => ({ operation: "read", collection, query }),
  createItem: (collection: string, item: unknown) => ({ operation: "create", collection, item }),
  withToken
}));
vi.mock("@/lib/directus/client", () => ({
  createDirectusRestClient: () => ({ request }),
  getDirectusUrl: () => "https://cms.example.com"
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
  getLocalizedPublishedTrainingProgramBySlug,
  getLocalizedPublishedTrainingPrograms,
  getPublishedTrainingProgramBySlug
} from "@/lib/directus/training";

function publishedProgram(overrides: Record<string, unknown> = {}) {
  return {
    id: "program-1",
    slug: "directus-only-program",
    category: "bootcamp",
    format: "Hybrid",
    duration_hours: 120,
    fee: "90000",
    currency: "TRY",
    location: "Istanbul + Online",
    certificate_available: true,
    instructor_name: "Dr. Ada Example",
    image_url: "/assets/training-image",
    application_open: true,
    status: "published",
    translations: [
      {
        id: "translation-en",
        language: "en",
        title: "English title",
        short_description: "English summary",
        description: "English description",
        image_alt: "English image alt",
        hours_breakdown: "English hours",
        instructor_role: "English role"
      },
      {
        id: "translation-tr",
        language: "tr",
        title: "Türkçe başlık",
        short_description: "Türkçe özet",
        description: "Türkçe açıklama",
        image_alt: "Türkçe görsel açıklaması",
        hours_breakdown: "Türkçe saat dağılımı",
        instructor_role: "Türkçe rol"
      }
    ],
    content_items: [],
    ...overrides
  };
}

const application = {
  programId: "program-1",
  phoneCountryCode: "+90",
  phoneNumber: "5525073889",
  message: "Please contact me"
};

describe("Directus training integration", () => {
  beforeEach(() => {
    request.mockReset();
    withToken.mockClear();
  });

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
    expect(withToken).not.toHaveBeenCalled();
  });

  it("loads Directus-only catalog programs and resolves the requested locale", async () => {
    request.mockResolvedValueOnce([publishedProgram()]);

    const result = await getLocalizedPublishedTrainingPrograms("tr");

    expect(result).toMatchObject({
      ok: true,
      data: [{
        id: "program-1",
        slug: "directus-only-program",
        title: "Türkçe başlık",
        description: "Türkçe açıklama",
        fee: 90000,
        currency: "TRY",
        applicationOpen: true
      }]
    });
    const query = request.mock.calls[0][0].query;
    expect(query.filter).toEqual({ status: { _eq: "published" } });
    expect(query.fields).toEqual(expect.arrayContaining([
      "id",
      "slug",
      "fee",
      "currency",
      "application_open",
      "status"
    ]));
    expect(query.fields).not.toContain("date_created");
    expect(query.fields).not.toContain("date_updated");
    expect(withToken).not.toHaveBeenCalled();
  });

  it("normalizes empty, remote, local-public, and Directus asset image URLs", async () => {
    request
      .mockResolvedValueOnce([publishedProgram({ image_url: null })])
      .mockResolvedValueOnce([publishedProgram({ image_url: "https://cdn.example.com/cover.png" })])
      .mockResolvedValueOnce([publishedProgram({ image_url: "/images/local-file.png" })])
      .mockResolvedValueOnce([publishedProgram({ image_url: "/assets/directus-file-uuid" })]);

    const empty = await getLocalizedPublishedTrainingPrograms("en");
    const remote = await getLocalizedPublishedTrainingPrograms("en");
    const local = await getLocalizedPublishedTrainingPrograms("tr");
    const directusAsset = await getLocalizedPublishedTrainingPrograms("en");

    expect(empty.ok && empty.data[0].image).toBeNull();
    expect(remote.ok && remote.data[0].image).toBe("https://cdn.example.com/cover.png");
    expect(local.ok && local.data[0]).toMatchObject({
      image: "/images/local-file.png",
      imageAlt: "Türkçe görsel açıklaması"
    });
    expect(directusAsset.ok && directusAsset.data[0].image).toBe(
      "https://cms.example.com/assets/directus-file-uuid"
    );
  });

  it("keeps localized public reads anonymous when an authenticated session exists", async () => {
    request.mockResolvedValueOnce([publishedProgram()]);

    await expect(getLocalizedPublishedTrainingPrograms("en")).resolves.toMatchObject({
      ok: true,
      data: [{ title: "English title" }]
    });

    expect(withToken).not.toHaveBeenCalled();
    expect(request.mock.calls[0][0]).toMatchObject({
      operation: "read",
      collection: "training_programs",
      query: { filter: { status: { _eq: "published" } } }
    });
  });

  it("falls back to English and then the first usable supported translation", async () => {
    request
      .mockResolvedValueOnce([publishedProgram()])
      .mockResolvedValueOnce([
        publishedProgram({
          translations: [
            {
              id: "translation-ar",
              language: "ar",
              title: "عنوان عربي",
              short_description: null,
              description: null,
              image_alt: null,
              hours_breakdown: null,
              instructor_role: null
            },
            {
              id: "translation-tr",
              language: "tr",
              title: "Türkçe başlık",
              short_description: null,
              description: null,
              image_alt: null,
              hours_breakdown: null,
              instructor_role: null
            }
          ]
        })
      ]);

    const englishFallback = await getLocalizedPublishedTrainingPrograms("fa");
    const firstFallback = await getLocalizedPublishedTrainingPrograms("fa");

    expect(englishFallback.ok && englishFallback.data[0].title).toBe("English title");
    expect(firstFallback.ok && firstFallback.data[0].title).toBe("Türkçe başlık");
  });

  it("excludes programs without a usable supported translation", async () => {
    request.mockResolvedValueOnce([
      publishedProgram({
        translations: [{
          id: "blank",
          language: "en",
          title: "  \n ",
          short_description: null,
          description: null,
          image_alt: null,
          hours_breakdown: null,
          instructor_role: null
        }]
      })
    ]);

    await expect(getLocalizedPublishedTrainingPrograms("en")).resolves.toEqual({
      ok: true,
      data: []
    });
  });

  it("maps and sorts localized curriculum and weekly-plan content", async () => {
    request.mockResolvedValueOnce([
      publishedProgram({
        content_items: [
          {
            id: "curriculum-2",
            kind: "curriculum",
            sort: 2,
            translations: [{ id: "c2-tr", language: "tr", title: "İkinci", description: null }]
          },
          {
            id: "week-2",
            kind: "weekly_plan",
            sort: 2,
            translations: [{ id: "w2-en", language: "en", title: "Week two", description: null }]
          },
          {
            id: "curriculum-1",
            kind: "curriculum",
            sort: 1,
            translations: [{ id: "c1-tr", language: "tr", title: "Birinci", description: null }]
          },
          {
            id: "week-1",
            kind: "weekly_plan",
            sort: 1,
            translations: [{ id: "w1-tr", language: "tr", title: "Birinci hafta", description: null }]
          }
        ]
      })
    ]);

    const result = await getLocalizedPublishedTrainingProgramBySlug("directus-only-program", "tr");

    expect(result.ok && result.data?.curriculum.map((item) => item.title)).toEqual([
      "Birinci",
      "İkinci"
    ]);
    expect(result.ok && result.data?.weeklyPlan.map((item) => item.title)).toEqual([
      "Birinci hafta",
      "Week two"
    ]);
    expect(request.mock.calls[0][0].query.filter).toEqual({
      slug: { _eq: "directus-only-program" },
      status: { _eq: "published" }
    });
    expect(withToken).not.toHaveBeenCalled();
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
    expect(withToken).toHaveBeenCalledWith("server-only-token", expect.anything());
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
          "currency",
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
    expect(withToken).toHaveBeenCalledWith("server-only-token", expect.anything());
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
