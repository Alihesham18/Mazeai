import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";

const {
  getPublishedCaseStudies,
  getPublishedEvents
} = vi.hoisted(() => ({
  getPublishedCaseStudies: vi.fn(),
  getPublishedEvents: vi.fn()
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async ({ locale }: { locale: "en" | "ar" }) => {
    const messages = locale === "ar" ? ar : en;

    return (key: string) => {
      const value = key.split(".").reduce<unknown>((current, part) => {
        if (typeof current !== "object" || current === null) return undefined;
        return (current as Record<string, unknown>)[part];
      }, messages);

      return typeof value === "string" ? value : key;
    };
  })
}));
vi.mock("@/lib/directus/events", () => ({ getPublishedEvents }));
vi.mock("@/lib/directus/case-studies", () => ({ getPublishedCaseStudies }));
vi.mock("@/components/home/NewsPopup/NewsPopup", () => ({
  NewsPopup: () => null
}));

import { HomePage } from "@/components/sections/HomePage";

describe("HomePage hero", () => {
  beforeEach(() => {
    getPublishedEvents.mockResolvedValue({ ok: true, data: [] });
    getPublishedCaseStudies.mockResolvedValue({ ok: true, data: [] });
  });

  it("renders one localized H1, both routed CTAs, trust labels, and the lightweight graphic", async () => {
    render(await HomePage({ locale: "en" }));

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(en.home.headline);
    expect(screen.getByRole("link", { name: en.home.primaryCta })).toHaveAttribute(
      "href",
      "/en/services"
    );
    expect(screen.getByRole("link", { name: en.home.researchCta })).toHaveAttribute(
      "href",
      "/en/research"
    );
    expect(screen.getAllByText(en.home.aiPathTitle)).toHaveLength(2);
    expect(screen.getByRole("img", { name: en.home.visualLabel })).toBeInTheDocument();
    expect(document.querySelector('img[src="/images/hero-ai-chip.png"]')).not.toBeInTheDocument();
  });

  it("renders Arabic hero copy and routes without introducing English content", async () => {
    const view = render(<div dir="rtl">{await HomePage({ locale: "ar" })}</div>);

    expect(view.container.firstElementChild).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(ar.home.headline);
    expect(screen.getByRole("link", { name: ar.home.primaryCta })).toHaveAttribute(
      "href",
      "/ar/services"
    );
    expect(screen.getByRole("img", { name: ar.home.visualLabel })).toBeInTheDocument();
  });
});
