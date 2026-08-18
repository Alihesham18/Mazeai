import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPublishedCaseStudies } = vi.hoisted(() => ({ getPublishedCaseStudies: vi.fn() }));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async ({ namespace }: { namespace: string }) =>
    (key: string, values?: { title?: string }) =>
      namespace === "pages.caseStudies" ? key : `${key}${values?.title ? `:${values.title}` : ""}`
  )
}));
vi.mock("@/lib/directus/case-studies", () => ({ getPublishedCaseStudies }));
vi.mock("@/components/case-studies/CaseStudyCoverImage", () => ({
  CaseStudyCoverImage: ({ alt, src }: { alt: string; src: string }) => (
    <span aria-label={alt} data-src={src} role="img" />
  )
}));

import { CaseStudiesOverviewPage } from "@/components/pages/CaseStudiesOverviewPage";

const caseStudy = {
  id: "case-1",
  slug: "ai-platform",
  featured: true,
  publishedAt: "2026-08-01T00:00:00Z",
  coverImage: "https://cms.example.com/assets/cover",
  industry: "Technology",
  client: "Example Client",
  technologies: ["AI", "Directus"],
  locale: "tr",
  title: "Türkçe Başlık",
  shortDescription: "Türkçe açıklama",
  challenge: "Zorluk",
  solution: "Çözüm",
  results: "Sonuç",
  content: "İçerik"
};

describe("CaseStudiesOverviewPage", () => {
  beforeEach(() => getPublishedCaseStudies.mockReset());

  it("renders Directus locale content, metadata, cover, technologies, and slug link", async () => {
    getPublishedCaseStudies.mockResolvedValue({ ok: true, data: [caseStudy] });
    render(await CaseStudiesOverviewPage({ locale: "tr" }));

    expect(getPublishedCaseStudies).toHaveBeenCalledWith("tr");
    expect(screen.getByRole("heading", { name: "Türkçe Başlık" })).toBeInTheDocument();
    expect(screen.getByText("Türkçe açıklama")).toBeInTheDocument();
    expect(screen.getByText("Technology")).toBeInTheDocument();
    expect(screen.getByText("Example Client")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Türkçe Başlık" })).toHaveAttribute(
      "data-src",
      caseStudy.coverImage
    );
    expect(screen.getByRole("link", { name: "readCaseStudy:Türkçe Başlık" })).toHaveAttribute(
      "href",
      "/tr/case-studies/ai-platform"
    );
  });

  it("renders the empty result state", async () => {
    getPublishedCaseStudies.mockResolvedValue({ ok: true, data: [] });
    render(await CaseStudiesOverviewPage({ locale: "en" }));
    expect(screen.getByText("empty")).toBeInTheDocument();
  });

  it("renders a safe error state", async () => {
    getPublishedCaseStudies.mockResolvedValue({ ok: false, error: "requestFailed" });
    render(await CaseStudiesOverviewPage({ locale: "en" }));
    expect(screen.getByRole("alert")).toHaveTextContent("unableToLoad");
  });
});
