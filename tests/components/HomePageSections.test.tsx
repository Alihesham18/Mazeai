import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";

const {
  getPublishedCaseStudies,
  getPublishedEvents,
  getLocalizedPublishedTrainingPrograms
} = vi.hoisted(() => ({
  getPublishedCaseStudies: vi.fn(),
  getPublishedEvents: vi.fn(),
  getLocalizedPublishedTrainingPrograms: vi.fn()
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string, values?: Record<string, string | number>) => {
    const value = key.split(".").reduce<unknown>((current, part) => {
      if (typeof current !== "object" || current === null) return undefined;
      return (current as Record<string, unknown>)[part];
    }, en);

    return typeof value === "string"
      ? value.replace(/\{(\w+)\}/g, (_, name: string) => String(values?.[name] ?? `{${name}}`))
      : key;
  })
}));
vi.mock("@/lib/directus/events", () => ({ getPublishedEvents }));
vi.mock("@/lib/directus/case-studies", () => ({ getPublishedCaseStudies }));
vi.mock("@/lib/directus/training", () => ({ getLocalizedPublishedTrainingPrograms }));
vi.mock("@/components/home/NewsPopup/NewsPopup", () => ({ NewsPopup: () => null }));
vi.mock("@/components/case-studies/CaseStudyCoverImage", () => ({
  CaseStudyCoverImage: ({ alt, src }: { alt: string; src: string }) => (
    <span aria-label={alt} data-src={src} role="img" />
  )
}));

import { HomePage } from "@/components/sections/HomePage";

const caseStudy = {
  id: "case-1",
  slug: "cms-case",
  featured: true,
  publishedAt: "2026-08-01T00:00:00Z",
  coverImage: "https://cms.example.com/assets/case",
  industry: "Education",
  client: null,
  technologies: ["AI", "Directus"],
  locale: "en",
  title: "CMS Case Study",
  shortDescription: "A real CMS case-study summary.",
  challenge: null,
  solution: null,
  results: null,
  content: null
};

const event = {
  id: 1,
  slug: "cms-event",
  title: "CMS Event",
  short_description: "A real upcoming event.",
  description: null,
  event_date: "2099-09-20T15:00:00Z",
  end_date: null,
  location: "Istanbul",
  format: "Hybrid",
  image_url: null,
  registration_open: true,
  capacity: null,
  status: "published"
};

describe("HomePage sections", () => {
  beforeEach(() => {
    getLocalizedPublishedTrainingPrograms.mockReset();
    getPublishedEvents.mockResolvedValue({ ok: true, data: [event] });
    getPublishedCaseStudies.mockResolvedValue({ ok: true, data: [caseStudy] });
  });

  it("renders the curated section order and preserves every deeper route", async () => {
    const view = render(await HomePage({ locale: "en" }));

    expect(
      [...view.container.querySelectorAll("[data-home-section]")].map((section) =>
        section.getAttribute("data-home-section")
      )
    ).toEqual([
      "capabilities",
      "work",
      "ecosystem",
      "activity",
      "cta"
    ]);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getAllByRole("link", { name: en.home.explore }).map((link) => link.getAttribute("href"))
    ).toEqual(["/en/services", "/en/research", "/en/training"]);
    expect(screen.queryByText(en.home.projectsTitle)).not.toBeInTheDocument();
    expect(view.container.querySelector('[data-home-section="research"]')).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Read CMS Case Study/ })).toHaveAttribute(
      "href",
      "/en/case-studies/cms-case"
    );
    expect(screen.getByRole("link", { name: en.home.viewEvent })).toHaveAttribute(
      "href",
      "/en/events/cms-event"
    );
    expect(screen.queryByText("CMS Training")).not.toBeInTheDocument();
    expect(getLocalizedPublishedTrainingPrograms).not.toHaveBeenCalled();
    expect(screen.queryByText("CMS Insight")).not.toBeInTheDocument();
    expect(screen.getByText(en.home.why.one)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Doğa Koleji/ })).toBeInTheDocument();
    expect(screen.getByAltText("Doğa Koleji")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: en.home.secondaryCta }).at(-1)).toHaveAttribute(
      "href",
      "/en/contact"
    );

    const ids = [...view.container.querySelectorAll("[id]")].map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("renders localized safe states when dynamic homepage collections are empty", async () => {
    getPublishedEvents.mockResolvedValue({ ok: true, data: [] });
    getPublishedCaseStudies.mockResolvedValue({ ok: true, data: [] });

    render(await HomePage({ locale: "en" }));

    expect(screen.getByText(en.events.noEvents)).toBeInTheDocument();
    expect(screen.getByText(en.caseStudies.empty)).toBeInTheDocument();
    expect(getLocalizedPublishedTrainingPrograms).not.toHaveBeenCalled();
  });

  it("normalizes dynamic source failures without removing the section architecture", async () => {
    getPublishedEvents.mockResolvedValue({ ok: false, error: "requestFailed" });
    getPublishedCaseStudies.mockResolvedValue({ ok: false, error: "requestFailed" });

    render(await HomePage({ locale: "en" }));

    expect(screen.getByText(en.events.unableToLoadEvents)).toHaveAttribute("role", "alert");
    expect(screen.getByText(en.caseStudies.unableToLoad)).toHaveAttribute("role", "alert");
    expect(getLocalizedPublishedTrainingPrograms).not.toHaveBeenCalled();
  });
});
