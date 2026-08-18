import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async () => (key: string) => key)
}));
vi.mock("@/components/case-studies/CaseStudyCoverImage", () => ({
  CaseStudyCoverImage: ({ alt, src }: { alt: string; src: string }) => (
    <span aria-label={alt} data-src={src} role="img" />
  )
}));

import { CaseStudyDetailPage } from "@/components/pages/CaseStudyDetailPage";

const caseStudy = {
  id: "case-1",
  slug: "ai-platform",
  featured: false,
  publishedAt: null,
  coverImage: "https://cms.example.com/assets/cover",
  industry: "Technology",
  client: "Example Client",
  technologies: ["AI", "Next.js"],
  locale: "en" as const,
  title: "AI Platform",
  shortDescription: "A localized overview",
  challenge: "Legacy workflows",
  solution: "A secure automation platform",
  results: "Faster processing",
  content: "Detailed content\nSecond paragraph"
};

describe("CaseStudyDetailPage", () => {
  it("renders localized detail sections, metadata, technologies, and cover image", async () => {
    render(await CaseStudyDetailPage({ caseStudy, locale: "en" }));
    expect(screen.getByRole("heading", { name: "AI Platform" })).toBeInTheDocument();
    expect(screen.getByText("Legacy workflows")).toBeInTheDocument();
    expect(screen.getByText("A secure automation platform")).toBeInTheDocument();
    expect(screen.getByText("Faster processing")).toBeInTheDocument();
    expect(screen.getByText(/Detailed content/)).toBeInTheDocument();
    expect(screen.getByText("Example Client")).toBeInTheDocument();
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "AI Platform" })).toHaveAttribute(
      "data-src",
      caseStudy.coverImage
    );
  });

  it("hides optional sections, client, technologies, and cover when absent", async () => {
    render(await CaseStudyDetailPage({
      locale: "fa",
      caseStudy: {
        ...caseStudy,
        locale: "fa",
        title: "عنوان فارسی",
        client: null,
        technologies: [],
        coverImage: null,
        challenge: null,
        results: null,
        content: null
      }
    }));
    expect(screen.queryByRole("heading", { name: "challenge" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "results" })).not.toBeInTheDocument();
    expect(screen.queryByText("client")).not.toBeInTheDocument();
    expect(screen.queryByText("technologies")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "solution" })).toBeInTheDocument();
  });
});
