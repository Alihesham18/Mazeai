import { beforeEach, describe, expect, it, vi } from "vitest";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));
vi.mock("@directus/sdk", () => ({
  readItems: (collection: string, query: unknown) => ({ collection, operation: "read", query }),
  isDirectusError: vi.fn(() => false)
}));
vi.mock("@/lib/directus/client", () => ({
  createDirectusRestClient: () => ({ request }),
  getDirectusUrl: () => "https://cms.example.com"
}));

import {
  getPublishedCaseStudies,
  getPublishedCaseStudyBySlug,
  normalizeCaseStudyCoverImage,
  normalizeCaseStudyTechnologies,
  richTextToPlainText
} from "@/lib/directus/case-studies";

function translation(language: string, title: string | null) {
  return {
    id: `${language}-translation`,
    language,
    title,
    short_description: `<p>${title ?? ""} summary</p>`,
    challenge: "Challenge",
    solution: "Solution",
    results: "Results",
    content: "<p>First paragraph</p><p>Second paragraph</p>"
  };
}

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: "case-1",
    slug: "document-automation",
    status: "published",
    featured: true,
    published_at: "2026-08-01T00:00:00Z",
    cover_image: "cover-file-id",
    industry: "Technology",
    client: "Example Client",
    sort: 1,
    technologies: ["AI", "Next.js", null, "AI", "  Directus  "],
    translations: [translation("en", "English title"), translation("tr", "Türkçe başlık")],
    ...overrides
  };
}

describe("Directus Case Studies", () => {
  beforeEach(() => request.mockReset());

  it("maps published records, selects the requested locale, and normalizes CMS fields", async () => {
    request.mockResolvedValueOnce([record()]);

    const result = await getPublishedCaseStudies("tr");

    expect(result.ok && result.data[0]).toMatchObject({
      id: "case-1",
      slug: "document-automation",
      title: "Türkçe başlık",
      locale: "tr",
      shortDescription: "Türkçe başlık summary",
      featured: true,
      coverImage: "https://cms.example.com/assets/cover-file-id",
      technologies: ["AI", "Next.js", "Directus"]
    });
    const query = request.mock.calls[0][0].query;
    expect(query.filter).toEqual({ status: { _eq: "published" } });
    expect(query.fields).not.toContain("date_created");
    expect(query.fields).not.toContain("date_updated");
    expect(query.fields).not.toContain("user_created");
    expect(query.sort).toEqual(["sort", "-published_at", "slug", "id"]);
  });

  it("falls back to English and then the first usable translation", async () => {
    request.mockResolvedValueOnce([
      record({ id: "english", translations: [translation("en", "English fallback")] }),
      record({ id: "first", slug: "first", translations: [translation("fa", "عنوان فارسی")] })
    ]);

    const result = await getPublishedCaseStudies("ar");

    expect(result.ok && result.data.map(({ title, locale }) => ({ title, locale }))).toEqual([
      { title: "English fallback", locale: "en" },
      { title: "عنوان فارسی", locale: "fa" }
    ]);
  });

  it("excludes records with no usable translation", async () => {
    request.mockResolvedValueOnce([
      record({ translations: [translation("en", "  "), translation("de", "Deutsch")] })
    ]);

    await expect(getPublishedCaseStudies("en")).resolves.toEqual({ ok: true, data: [] });
  });

  it("sorts by sort value, newest publication, then stable slug", async () => {
    request.mockResolvedValueOnce([
      record({ id: "third", slug: "zeta", sort: null }),
      record({ id: "second", slug: "beta", sort: 2, published_at: "2026-08-02T00:00:00Z" }),
      record({ id: "first", slug: "alpha", sort: 2, published_at: "2026-08-03T00:00:00Z" })
    ]);

    const result = await getPublishedCaseStudies("en");

    expect(result.ok && result.data.map((item) => item.id)).toEqual(["first", "second", "third"]);
  });

  it("looks up a published detail by slug and returns null for an unusable translation", async () => {
    request.mockResolvedValueOnce([record()]);
    const found = await getPublishedCaseStudyBySlug("document-automation", "en");
    expect(found.ok && found.data?.title).toBe("English title");
    expect(request.mock.calls[0][0].query.filter).toEqual({
      slug: { _eq: "document-automation" },
      status: { _eq: "published" }
    });
    expect(request.mock.calls[0][0].query.limit).toBe(1);

    request.mockResolvedValueOnce([record({ translations: [] })]);
    await expect(getPublishedCaseStudyBySlug("document-automation", "en")).resolves.toEqual({
      ok: true,
      data: null
    });
  });

  it("normalizes malformed technologies and Directus cover image shapes", () => {
    expect(normalizeCaseStudyTechnologies(null)).toEqual([]);
    expect(normalizeCaseStudyTechnologies("not-json")).toEqual([]);
    expect(normalizeCaseStudyTechnologies('["AI", "Directus"]')).toEqual(["AI", "Directus"]);
    expect(normalizeCaseStudyCoverImage({ id: "file id" })).toBe(
      "https://cms.example.com/assets/file%20id"
    );
    expect(normalizeCaseStudyCoverImage("https://cms.example.com/assets/cover.jpg")).toBe(
      "https://cms.example.com/assets/cover.jpg"
    );
    expect(normalizeCaseStudyCoverImage("https://untrusted.example/cover.jpg")).toBeNull();
  });

  it("renders rich CMS content as safe readable text", () => {
    expect(
      richTextToPlainText('<p>Hello &amp; welcome</p><script>alert("unsafe")</script><p>Next</p>')
    ).toBe("Hello & welcome\n\nNext");
  });

  it("returns a safe failure without exposing the Directus error", async () => {
    request.mockRejectedValueOnce(new Error("private backend detail"));
    await expect(getPublishedCaseStudies("en")).resolves.toEqual({
      ok: false,
      error: "requestFailed"
    });
  });
});
