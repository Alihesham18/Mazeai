import { beforeEach, describe, expect, it, vi } from "vitest";

const { request, createClient } = vi.hoisted(() => ({
  request: vi.fn(),
  createClient: vi.fn()
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));
vi.mock("@directus/sdk", () => ({
  readItems: (collection: string, query: unknown) => ({ collection, operation: "read", query }),
  isDirectusError: vi.fn(() => false)
}));
vi.mock("@/lib/directus/client", () => ({
  createDirectusRestClient: createClient,
  getDirectusUrl: () => "https://cms.example.com"
}));

import {
  getPublishedTeamMembers,
  normalizeLinkedInUrl,
  normalizeTeamExpertise,
  normalizeTeamMember,
  normalizeTeamPhoto
} from "@/lib/directus/team";

function translation(language: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `${language}-translation`,
    language,
    job_title: language === "tr" ? "Kurucu ve CEO" : "Founder & CEO",
    bio: `<p>${language} biography</p>`,
    expertise: language === "tr" ? ["Liderlik", "Yapay Zeka"] : ["Leadership", "AI"],
    photo_alt:
      language === "tr" ? "Mahyar Teymournezhad portresi" : "Portrait of Mahyar Teymournezhad",
    ...overrides
  };
}

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: "member-1",
    status: "published",
    sort: 1,
    slug: "mahyar-teymournezhad",
    full_name: "Mahyar Teymournezhad",
    photo: { id: "photo-file-id" },
    linkedin_url: "https://www.linkedin.com/in/mahyarteymournezhad?tracking=test#profile",
    category: "leadership",
    expertise: ["Leadership", "AI"],
    translations: [translation("en"), translation("tr")],
    ...overrides
  };
}

describe("Directus Team", () => {
  beforeEach(() => {
    request.mockReset();
    createClient.mockReset();
    createClient.mockReturnValue({ request });
  });

  it("returns only published records in stable sort order and requests minimal fields", async () => {
    request.mockResolvedValueOnce([
      record({ id: "last", slug: "zeta", sort: null }),
      record({ id: "draft", slug: "draft-member", status: "draft", sort: 0 }),
      record({ id: "second", slug: "beta", sort: 2 }),
      record({ id: "first", slug: "alpha", sort: 2 })
    ]);

    const result = await getPublishedTeamMembers("en");

    expect(result.ok && result.data.map((member) => member.id)).toEqual([
      "first",
      "second",
      "last"
    ]);
    const query = request.mock.calls[0][0].query;
    expect(query.filter).toEqual({ status: { _eq: "published" } });
    expect(query.sort).toEqual(["sort", "slug", "id"]);
    expect(query.fields).not.toContain("date_created");
    expect(query.fields).not.toContain("user_created");
  });

  it("selects the requested locale and falls back to English", async () => {
    request.mockResolvedValueOnce([record()]);
    const turkish = await getPublishedTeamMembers("tr");
    expect(turkish.ok && turkish.data[0]).toMatchObject({
      locale: "tr",
      jobTitle: "Kurucu ve CEO",
      expertise: ["Liderlik", "Yapay Zeka"]
    });

    request.mockResolvedValueOnce([record()]);
    const arabic = await getPublishedTeamMembers("ar");
    expect(arabic.ok && arabic.data[0]).toMatchObject({
      locale: "en",
      jobTitle: "Founder & CEO"
    });
  });

  it("normalizes photos, LinkedIn URLs, expertise, and rich biography content", () => {
    const member = normalizeTeamMember(record(), "en");
    expect(member).toMatchObject({
      fullName: "Mahyar Teymournezhad",
      photoUrl: "https://cms.example.com/assets/photo-file-id",
      linkedinUrl: "https://www.linkedin.com/in/mahyarteymournezhad",
      bio: "en biography",
      expertise: ["Leadership", "AI"]
    });
    expect(normalizeTeamPhoto({ id: "file id" })).toBeNull();
    expect(normalizeLinkedInUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeLinkedInUrl("https://example.com/in/person")).toBeNull();
    expect(normalizeLinkedInUrl("https://www.linkedin.com/company/mazeai")).toBeNull();
    expect(normalizeTeamExpertise('["AI", " AI ", null, "Research"]')).toEqual(["AI", "Research"]);
    expect(normalizeTeamExpertise("invalid-json")).toEqual([]);
  });

  it("drops malformed required data while tolerating missing optional fields", () => {
    expect(normalizeTeamMember(record({ slug: "Unsafe Slug" }), "en")).toBeNull();
    expect(normalizeTeamMember(record({ translations: [] }), "en")).toBeNull();
    expect(
      normalizeTeamMember(
        record({
          photo: null,
          linkedin_url: "not-a-url",
          translations: [translation("en", { expertise: null, photo_alt: null })]
        }),
        "en"
      )
    ).toMatchObject({
      photoUrl: null,
      photoAlt: "Mahyar Teymournezhad",
      linkedinUrl: null,
      expertise: ["Leadership", "AI"]
    });
  });

  it("returns safe configuration and request failures", async () => {
    createClient.mockReturnValueOnce(null);
    await expect(getPublishedTeamMembers("en")).resolves.toEqual({
      ok: false,
      error: "configuration"
    });

    createClient.mockReturnValueOnce({ request });
    request.mockRejectedValueOnce(new Error("private backend detail"));
    await expect(getPublishedTeamMembers("en")).resolves.toEqual({
      ok: false,
      error: "requestFailed"
    });
  });
});
