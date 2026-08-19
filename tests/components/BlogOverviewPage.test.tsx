import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPublishedBlogPosts } = vi.hoisted(() => ({ getPublishedBlogPosts: vi.fn() }));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async ({ namespace }: { namespace: string }) =>
    (key: string, values?: { title?: string; date?: string }) =>
      namespace === "pages.blog"
        ? key
        : `${key}${values?.title ? `:${values.title}` : ""}${values?.date ? `:${values.date}` : ""}`
  )
}));
vi.mock("@/lib/directus/blog", () => ({ getPublishedBlogPosts }));

import { BlogOverviewPage } from "@/components/pages/BlogOverviewPage";

function post(id: string, title: string, slug: string, locale = "en") {
  return {
    id,
    slug,
    sort: Number(id),
    publishedAt: null,
    locale,
    title,
    excerpt: `${title} excerpt`,
    content: null,
    seoTitle: title,
    seoDescription: `${title} excerpt`
  };
}

describe("BlogOverviewPage", () => {
  beforeEach(() => getPublishedBlogPosts.mockReset());

  it("renders localized posts in service order with CMS slug links and no whitelist", async () => {
    getPublishedBlogPosts.mockResolvedValue({
      ok: true,
      data: [post("1", "Türkçe ilk", "brand-new-post", "tr"), post("2", "Türkçe ikinci", "second", "tr")]
    });
    render(await BlogOverviewPage({ locale: "tr" }));

    expect(getPublishedBlogPosts).toHaveBeenCalledWith("tr");
    expect(screen.getAllByRole("heading", { level: 3 }).map(({ textContent }) => textContent)).toEqual([
      "Türkçe ilk",
      "Türkçe ikinci"
    ]);
    expect(screen.getByText("Türkçe ilk excerpt")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "readArticle:Türkçe ilk" })).toHaveAttribute(
      "href",
      "/tr/blog/brand-new-post"
    );
  });

  it.each([
    ["en", "English title"],
    ["tr", "Türkçe başlık"],
    ["ar", "عنوان عربي"],
    ["fa", "عنوان فارسی"]
  ] as const)("renders %s localized title and excerpt", async (locale, title) => {
    getPublishedBlogPosts.mockResolvedValue({ ok: true, data: [post("1", title, "post", locale)] });
    render(await BlogOverviewPage({ locale }));
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(`${title} excerpt`)).toBeInTheDocument();
  });

  it("distinguishes empty and unavailable states", async () => {
    getPublishedBlogPosts.mockResolvedValueOnce({ ok: true, data: [] });
    const emptyView = render(await BlogOverviewPage({ locale: "en" }));
    expect(screen.getByText("empty")).toBeInTheDocument();
    emptyView.unmount();

    getPublishedBlogPosts.mockResolvedValueOnce({ ok: false, error: "requestFailed" });
    render(await BlogOverviewPage({ locale: "en" }));
    expect(screen.getByRole("alert")).toHaveTextContent("unableToLoad");
  });
});
