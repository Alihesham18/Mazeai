import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getBySlug, notFound } = vi.hoisted(() => ({
  getBySlug: vi.fn(),
  notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); })
}));

vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/lib/directus/case-studies", () => ({ getPublishedCaseStudyBySlug: getBySlug }));
vi.mock("@/components/pages/CaseStudyDetailPage", () => ({
  CaseStudyDetailPage: ({ caseStudy }: { caseStudy: { title: string } }) => <p>{caseStudy.title}</p>,
  CaseStudyLoadError: () => <p role="alert">safe-error</p>
}));

import CaseStudyPage from "@/app/[locale]/case-studies/[slug]/page";

describe("Case Study detail route", () => {
  beforeEach(() => {
    getBySlug.mockReset();
    notFound.mockClear();
  });

  it("renders the normalized locale detail", async () => {
    getBySlug.mockResolvedValue({ ok: true, data: { title: "Türkçe vaka" } });
    render(await CaseStudyPage({ params: { locale: "tr", slug: "vaka" } }));
    expect(getBySlug).toHaveBeenCalledWith("vaka", "tr");
    expect(screen.getByText("Türkçe vaka")).toBeInTheDocument();
  });

  it("uses not-found for an unknown slug or unusable translation", async () => {
    getBySlug.mockResolvedValue({ ok: true, data: null });
    await expect(CaseStudyPage({ params: { locale: "en", slug: "missing" } })).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("renders a safe error state when Directus fails", async () => {
    getBySlug.mockResolvedValue({ ok: false, error: "requestFailed" });
    render(await CaseStudyPage({ params: { locale: "en", slug: "unavailable" } }));
    expect(screen.getByRole("alert")).toHaveTextContent("safe-error");
  });
});
