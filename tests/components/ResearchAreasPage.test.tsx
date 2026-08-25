import { render, screen, within } from "@testing-library/react";
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
  it("renders the laboratory header and all required semantic sections", async () => {
    render(await ResearchAreasPage({ locale: "en" }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.research.areas.title);
    expect(screen.getByRole("img", { name: en.research.areas.header.visualAriaLabel })).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: en.research.areas.domains.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.research.areas.methodology.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.research.areas.technology.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.research.areas.collaboration.title })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(4);

    expect(screen.queryByText("Purpose and scope")).not.toBeInTheDocument();
    expect(screen.queryByText("How we approach it")).not.toBeInTheDocument();
    expect(screen.queryByText("Start a conversation")).not.toBeInTheDocument();
  });

  it("renders the four specified domains, focus tags, methodology, and technology registry", async () => {
    render(await ResearchAreasPage({ locale: "en" }));

    for (const domain of Object.values(en.research.areas.domains.items)) {
      const domainArticle = screen.getByRole("heading", { name: domain.title }).closest("article");
      expect(domainArticle).not.toBeNull();
      expect(within(domainArticle as HTMLElement).getByText(domain.description)).toBeInTheDocument();
      for (const tag of Object.values(domain.tags)) {
        expect(within(domainArticle as HTMLElement).getByText(tag)).toBeInTheDocument();
      }
    }

    for (const stage of Object.values(en.research.areas.methodology.stages)) {
      expect(screen.getByRole("heading", { name: stage.title })).toBeInTheDocument();
      expect(screen.getByText(stage.description)).toBeInTheDocument();
    }

    const technologySection = screen.getByRole("heading", { name: en.research.areas.technology.title }).closest("section");
    expect(technologySection).not.toBeNull();
    for (const technology of Object.values(en.research.areas.technology.items)) {
      expect(within(technologySection as HTMLElement).getByText(technology)).toBeInTheDocument();
    }
  });

  it("localizes Arabic content, inherits RTL, and keeps the partnership route locale-prefixed", async () => {
    const view = render(
      <div dir="rtl">
        {await ResearchAreasPage({ locale: "ar" })}
      </div>
    );

    expect(view.container.firstElementChild).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(ar.research.areas.title);
    expect(screen.getByRole("heading", { name: ar.research.areas.domains.items.aiSystems.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: ar.research.areas.collaboration.action })).toHaveAttribute(
      "href",
      "/ar/research/partnerships"
    );
  });

  it("provides complete, non-empty page copy in every supported locale", () => {
    const required = [
      "overline",
      "title",
      "description",
      "header.visualAriaLabel",
      "domains.items.machineLearning.description",
      "domains.items.computerVision.tags.three",
      "domains.items.aiSystems.title",
      "domains.items.appliedAI.description",
      "methodology.stages.discover.description",
      "methodology.stages.develop.description",
      "methodology.stages.validate.description",
      "methodology.stages.apply.description",
      "technology.items.naturalLanguageProcessing",
      "technology.items.researchEngineering",
      "collaboration.action"
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
