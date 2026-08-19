import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getBySlug, notFound } = vi.hoisted(() => ({
  getBySlug: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  })
}));

vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/lib/directus/blog", () => ({ getPublishedBlogPostBySlug: getBySlug }));
vi.mock("@/components/pages/BlogDetailPage", () => ({
  BlogDetailPage: ({ post }: { post: { title: string } }) => <p>{post.title}</p>,
  BlogLoadError: () => <p role="alert">safe-error</p>
}));

import BlogPostPage, { generateMetadata } from "@/app/[locale]/blog/[slug]/page";

const normalizedPost = {
  id: "post-id",
  slug: "responsible-ai-starting-points",
  title: "Responsible AI",
  excerpt: "Article excerpt",
  seoTitle: "SEO title",
  seoDescription: "SEO description",
  publishedAt: "2026-08-19T08:00:00Z"
};

describe("Blog detail route", () => {
  beforeEach(() => {
    getBySlug.mockReset();
    notFound.mockClear();
  });

  it.each([
    "responsible-ai-starting-points",
    "from-research-to-prototype",
    "ai-literacy-for-organizations"
  ])("handles legacy URL through the dynamic route: %s", async (slug) => {
    getBySlug.mockResolvedValue({ ok: true, data: { ...normalizedPost, slug, title: slug } });
    render(await BlogPostPage({ params: { locale: "en", slug } }));
    expect(getBySlug).toHaveBeenCalledWith(slug, "en");
    expect(screen.getByText(slug)).toBeInTheDocument();
  });

  it("uses not-found for unknown, draft-filtered, or untranslated results", async () => {
    getBySlug.mockResolvedValue({ ok: true, data: null });
    await expect(
      BlogPostPage({ params: { locale: "en", slug: "not-public" } })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("renders a safe error state when Directus fails", async () => {
    getBySlug.mockResolvedValue({ ok: false, error: "requestFailed" });
    render(await BlogPostPage({ params: { locale: "en", slug: "unavailable" } }));
    expect(screen.getByRole("alert")).toHaveTextContent("safe-error");
  });

  it("builds localized canonical and article metadata with normalized SEO values", async () => {
    getBySlug.mockResolvedValue({ ok: true, data: normalizedPost });
    const metadata = await generateMetadata({
      params: { locale: "fa", slug: "responsible-ai-starting-points" }
    });
    expect(metadata).toMatchObject({
      title: "SEO title | SynergyMazeAI",
      description: "SEO description",
      alternates: { canonical: "/fa/blog/responsible-ai-starting-points" },
      openGraph: { type: "article", title: "SEO title" }
    });

    getBySlug.mockResolvedValueOnce({ ok: true, data: null });
    await expect(
      generateMetadata({ params: { locale: "en", slug: "draft" } })
    ).resolves.toEqual({});
  });
});
