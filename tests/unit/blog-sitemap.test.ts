import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPublishedBlogPosts } = vi.hoisted(() => ({ getPublishedBlogPosts: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/directus/blog", () => ({ getPublishedBlogPosts }));

import sitemap from "@/app/sitemap";

describe("Blog sitemap", () => {
  beforeEach(() => getPublishedBlogPosts.mockReset());

  it("includes returned published slugs for all four routing locales", async () => {
    getPublishedBlogPosts.mockResolvedValue({
      ok: true,
      data: [{ slug: "published-post", publishedAt: "2026-08-19T08:00:00Z" }]
    });
    const entries = await sitemap();
    const detailUrls = entries
      .map(({ url }) => url)
      .filter((url) => url.endsWith("/blog/published-post"));
    expect(detailUrls).toEqual([
      "https://synergymazeai.com/en/blog/published-post",
      "https://synergymazeai.com/tr/blog/published-post",
      "https://synergymazeai.com/ar/blog/published-post",
      "https://synergymazeai.com/fa/blog/published-post"
    ]);
    expect(getPublishedBlogPosts).toHaveBeenCalledWith("en");
  });

  it("keeps the base sitemap available when Directus fails", async () => {
    getPublishedBlogPosts.mockResolvedValue({ ok: false, error: "requestFailed" });
    const entries = await sitemap();
    expect(entries.some(({ url }) => url.endsWith("/en/blog"))).toBe(true);
    expect(entries.some(({ url }) => url.includes("/blog/undefined"))).toBe(false);
  });
});
