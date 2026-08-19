import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, request } = vi.hoisted(() => ({
  createClient: vi.fn(),
  request: vi.fn()
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
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  resolveBlogTranslation
} from "@/lib/directus/blog";

function translation(language: string, title: string | null, overrides = {}) {
  return {
    id: `${language}-translation`,
    language,
    title,
    excerpt: `${title ?? ""} excerpt`,
    content: null,
    seo_title: null,
    seo_description: null,
    ...overrides
  };
}

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    slug: "new-directus-post",
    status: "published",
    sort: 2,
    published_at: " 2026-08-19T08:00:00Z ",
    translations: [
      translation("en", "English title"),
      translation("tr", "Türkçe başlık"),
      translation("ar", "عنوان عربي"),
      translation("fa", "عنوان فارسی")
    ],
    ...overrides
  };
}

describe("Directus Blog service", () => {
  beforeEach(() => {
    request.mockReset();
    createClient.mockReset();
    createClient.mockReturnValue({ request });
  });

  it("uses an anonymous client, explicit fields, and a published-only catalog query", async () => {
    request.mockResolvedValueOnce([record()]);

    await getPublishedBlogPosts("en");

    expect(createClient).toHaveBeenCalledTimes(1);
    const operation = request.mock.calls[0][0];
    expect(operation.collection).toBe("blog_posts");
    expect(operation.query.filter).toEqual({ status: { _eq: "published" } });
    expect(operation.query.sort).toEqual(["sort", "slug", "id"]);
    expect(operation.query.fields).not.toContain("*");
    expect(JSON.stringify(operation.query.fields)).not.toContain("date_created");
    expect(operation).not.toHaveProperty("token");
  });

  it.each([
    ["en", "English title"],
    ["tr", "Türkçe başlık"],
    ["ar", "عنوان عربي"],
    ["fa", "عنوان فارسی"]
  ] as const)("selects the requested %s translation", async (locale, expectedTitle) => {
    request.mockResolvedValueOnce([record()]);
    const result = await getPublishedBlogPosts(locale);
    expect(result.ok && result.data[0]).toMatchObject({ locale, title: expectedTitle });
  });

  it("falls back to English and then deterministic supported-language order", () => {
    expect(resolveBlogTranslation([translation("en", "English")], "ar")?.language).toBe("en");
    expect(
      resolveBlogTranslation(
        [translation("fa", "فارسی"), translation("tr", "Türkçe")],
        "ar"
      )?.language
    ).toBe("tr");
  });

  it("excludes posts with no usable supported translation", async () => {
    request.mockResolvedValueOnce([
      record({ translations: [translation("en", "  "), translation("de", "Deutsch")] })
    ]);
    await expect(getPublishedBlogPosts("en")).resolves.toEqual({ ok: true, data: [] });
  });

  it("sorts records and normalizes slug, publication date, safe content, and SEO fallbacks", async () => {
    request.mockResolvedValueOnce([
      record({ id: "last", slug: "zeta", sort: null }),
      record({
        id: "first",
        slug: "alpha",
        sort: 1,
        translations: [
          translation("en", "Visible title", {
            excerpt: "Visible excerpt",
            content: "<p>Safe body</p><script>private()</script>",
            seo_title: " ",
            seo_description: ""
          })
        ]
      })
    ]);

    const result = await getPublishedBlogPosts("en");
    expect(result.ok && result.data.map(({ slug }) => slug)).toEqual(["alpha", "zeta"]);
    expect(result.ok && result.data[0]).toMatchObject({
      publishedAt: "2026-08-19T08:00:00Z",
      content: "Safe body",
      seoTitle: "Visible title",
      seoDescription: "Visible excerpt"
    });
  });

  it("normalizes an invalid publication date to null", async () => {
    request.mockResolvedValueOnce([record({ published_at: "not-a-date" })]);
    const result = await getPublishedBlogPosts("en");
    expect(result.ok && result.data[0].publishedAt).toBeNull();
  });

  it("queries detail by exact slug plus published status and returns null when untranslated", async () => {
    request.mockResolvedValueOnce([record()]);
    const found = await getPublishedBlogPostBySlug("new-directus-post", "fa");
    expect(found.ok && found.data?.slug).toBe("new-directus-post");
    expect(request.mock.calls[0][0].query.filter).toEqual({
      slug: { _eq: "new-directus-post" },
      status: { _eq: "published" }
    });
    expect(request.mock.calls[0][0].query.limit).toBe(1);

    request.mockResolvedValueOnce([record({ translations: [] })]);
    await expect(getPublishedBlogPostBySlug("new-directus-post", "en")).resolves.toEqual({
      ok: true,
      data: null
    });
  });

  it("returns safe configuration and request failures", async () => {
    createClient.mockReturnValueOnce(null);
    await expect(getPublishedBlogPosts("en")).resolves.toEqual({
      ok: false,
      error: "configuration"
    });

    request.mockRejectedValueOnce(new Error("private backend detail"));
    await expect(getPublishedBlogPosts("en")).resolves.toEqual({
      ok: false,
      error: "requestFailed"
    });
  });
});
