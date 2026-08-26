import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import fa from "../../messages/fa.json";
import tr from "../../messages/tr.json";

type SupportedLocale = "en" | "tr" | "ar" | "fa";
const catalogs = { en, tr, ar, fa } as const;

function resolveMessage(locale: SupportedLocale, namespace: string | undefined, key: string) {
  const path = namespace ? `${namespace}.${key}` : key;
  const value = path.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, catalogs[locale]);
  return typeof value === "string" ? value : path;
}

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(
    async ({ locale, namespace }: { locale: SupportedLocale; namespace?: string }) =>
      (key: string, values?: Record<string, string>) => {
        let message = resolveMessage(locale, namespace, key);
        for (const [name, value] of Object.entries(values ?? {})) {
          message = message.replace(`{${name}}`, value);
        }
        return message;
      }
  )
}));

import { ResearchAreasPage } from "@/components/pages/ResearchAreasPage";

describe("Research Areas page", () => {
  it("renders the premium hero, factual metrics, and all retained semantic sections", async () => {
    const view = render(await ResearchAreasPage({ locale: "en" }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.research.areas.title);
    const heroImage = screen.getByRole("img", { name: en.research.areas.hero.imageAlt });
    const impactImage = screen.getByRole("img", { name: en.research.areas.impact.imageAlt });
    expect(heroImage).toBeInTheDocument();
    expect(impactImage).toBeInTheDocument();
    expect(heroImage.getAttribute("src")).toContain("q=94");
    expect(impactImage.getAttribute("src")).toContain("q=92");
    expect(view.container.querySelectorAll("[data-network-node]")).toHaveLength(26);
    expect(view.container.querySelectorAll("svg[data-network]")).toHaveLength(2);
    const heroMedia = heroImage.closest("[data-interactive-media]");
    const impactMedia = impactImage.closest("[data-interactive-media]");
    expect(heroMedia).toContainElement(view.container.querySelector('svg[data-network="hero"]'));
    expect(impactMedia).toContainElement(
      view.container.querySelector('svg[data-network="impact"]')
    );
    expect(heroMedia?.closest("section")?.querySelector(":scope > svg[data-network]")).toBeNull();
    expect(impactMedia?.closest("section")?.querySelector(":scope > svg[data-network]")).toBeNull();
    expect(view.container.querySelector('svg[data-network="hero"]')).toHaveAttribute(
      "viewBox",
      "0 0 1536 511"
    );
    expect(view.container.querySelector('svg[data-network="impact"]')).toHaveAttribute(
      "viewBox",
      "0 0 1536 510"
    );
    for (const overlay of view.container.querySelectorAll("svg[data-network]")) {
      expect(overlay).toHaveAttribute("preserveAspectRatio", "xMidYMid slice");
    }
    for (const node of view.container.querySelectorAll<SVGCircleElement>(
      '[data-featured="true"]'
    )) {
      const overlay = node.closest("svg");
      expect(Number(node.getAttribute("cx"))).toBeGreaterThanOrEqual(0);
      expect(Number(node.getAttribute("cy"))).toBeGreaterThanOrEqual(0);
      expect(Number(node.getAttribute("cx"))).toBeLessThanOrEqual(
        Number(overlay?.dataset.sourceWidth)
      );
      expect(Number(node.getAttribute("cy"))).toBeLessThanOrEqual(
        Number(overlay?.dataset.sourceHeight)
      );
    }
    expect(screen.getByRole("link", { name: en.research.areas.hero.action })).toHaveAttribute(
      "href",
      "/en/research/projects"
    );

    expect(
      screen.getByRole("heading", { name: en.research.areas.domains.title })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: en.research.areas.methodology.title })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: en.research.areas.technology.title })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: en.research.areas.impact.title })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(screen.getAllByText("04").length).toBeGreaterThan(0);
    expect(screen.getAllByText("05").length).toBeGreaterThan(0);
    expect(screen.queryByText(/researchers/i)).not.toBeInTheDocument();
  });

  it("renders the four specified domains, focus tags, methodology, and technology registry", async () => {
    render(await ResearchAreasPage({ locale: "en" }));

    const desktopGrid = screen.getByTestId("research-area-grid");
    for (const domain of Object.values(en.research.areas.domains.items)) {
      const domainArticle = within(desktopGrid)
        .getByRole("heading", { name: domain.title })
        .closest("article");
      expect(domainArticle).not.toBeNull();
      expect(
        within(domainArticle as HTMLElement).getByText(domain.description)
      ).toBeInTheDocument();
      for (const tag of Object.values(domain.tags)) {
        expect(within(domainArticle as HTMLElement).getByText(tag)).toBeInTheDocument();
      }
    }

    for (const stage of Object.values(en.research.areas.methodology.stages)) {
      expect(screen.getByRole("heading", { name: stage.title })).toBeInTheDocument();
      expect(screen.getByText(stage.description)).toBeInTheDocument();
    }

    const technologySection = screen
      .getByRole("heading", { name: en.research.areas.technology.title })
      .closest("section");
    expect(technologySection).not.toBeNull();
    for (const technology of Object.values(en.research.areas.technology.items)) {
      expect(within(technologySection as HTMLElement).getByText(technology)).toBeInTheDocument();
    }
  });

  it("localizes Arabic content, inherits RTL, and keeps the partnership route locale-prefixed", async () => {
    const view = render(<div dir="rtl">{await ResearchAreasPage({ locale: "ar" })}</div>);

    expect(view.container.firstElementChild).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(ar.research.areas.title);
    expect(
      within(screen.getByTestId("research-area-grid")).getByRole("heading", {
        name: ar.research.areas.domains.items.aiSystems.title
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: ar.research.areas.impact.action })).toHaveAttribute(
      "href",
      "/ar/research/partnerships"
    );
  });

  it("provides a keyboard-operable single-open mobile accordion", async () => {
    render(await ResearchAreasPage({ locale: "en" }));
    const accordion = screen.getByTestId("research-area-accordion");
    const first = within(accordion).getByRole("button", {
      name: en.research.areas.domains.items.machineLearning.title
    });
    const second = within(accordion).getByRole("button", {
      name: en.research.areas.domains.items.computerVision.title
    });

    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(second).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(second);
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(second, { key: "Enter" });
    fireEvent.click(second);
    expect(second).toHaveAttribute("aria-expanded", "false");
  });

  it("provides complete, non-empty page copy in every supported locale", () => {
    const required = [
      "overline",
      "title",
      "description",
      "hero.statement",
      "hero.action",
      "hero.imageAlt",
      "hero.breadcrumb.label",
      "metrics.label",
      "metrics.projects.label",
      "metrics.method.value",
      "domains.items.machineLearning.description",
      "domains.mobileListLabel",
      "domains.items.computerVision.tags.three",
      "domains.items.aiSystems.title",
      "domains.items.appliedAI.description",
      "methodology.stages.discover.description",
      "methodology.stages.develop.description",
      "methodology.stages.validate.description",
      "methodology.stages.apply.description",
      "technology.items.naturalLanguageProcessing",
      "technology.items.researchEngineering",
      "impact.title",
      "impact.description",
      "impact.action",
      "impact.imageAlt"
    ];

    for (const locale of ["en", "tr", "ar", "fa"] as const) {
      for (const path of required) {
        const message = resolveMessage(locale, "research.areas", path);
        expect(message).not.toBe(`research.areas.${path}`);
        expect(message.trim()).not.toBe("");
      }
    }
  });
});
