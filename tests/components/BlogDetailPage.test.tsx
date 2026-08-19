import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async () => (key: string) => key)
}));

import { BlogDetailPage } from "@/components/pages/BlogDetailPage";

const post = {
  id: "post-1",
  slug: "cms-article",
  sort: 1,
  publishedAt: null,
  locale: "en" as const,
  title: "CMS article",
  excerpt: "Localized excerpt",
  content: "First paragraph\n\nSecond paragraph",
  seoTitle: "CMS article",
  seoDescription: "Localized excerpt"
};

describe("BlogDetailPage", () => {
  it("renders localized title, excerpt, safe normalized content, and slug-free back navigation", async () => {
    render(await BlogDetailPage({ post, locale: "en" }));
    expect(screen.getByRole("heading", { name: "CMS article" })).toBeInTheDocument();
    expect(screen.getByText("Localized excerpt")).toBeInTheDocument();
    expect(screen.getByText(/First paragraph/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "back" })).toHaveAttribute("href", "/en/blog");
  });

  it("omits the article body when CMS content is empty and never renders filler sections", async () => {
    render(await BlogDetailPage({ post: { ...post, locale: "fa", content: null }, locale: "fa" }));
    expect(screen.queryByLabelText("articleContent")).not.toBeInTheDocument();
    expect(screen.queryByText("Purpose and scope")).not.toBeInTheDocument();
    expect(screen.queryByText("How we approach it")).not.toBeInTheDocument();
  });
});
