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

import { ResearchPartnershipsPage } from "@/components/pages/ResearchPartnershipsPage";

describe("Research Partnerships page", () => {
  it("renders one H1 and the complete collaboration architecture", async () => {
    render(await ResearchPartnershipsPage({ locale: "en" }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.research.partnerships.title);
    expect(screen.getByRole("img", { name: en.research.partnerships.header.visualAriaLabel })).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: en.research.partnerships.audiences.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.research.partnerships.models.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.research.partnerships.scope.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.research.partnerships.process.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.research.partnerships.ecosystem.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.research.partnerships.final.title })).toBeInTheDocument();
  });

  it("renders every audience, collaboration model, scope item, and process stage", async () => {
    render(await ResearchPartnershipsPage({ locale: "en" }));

    for (const audience of Object.values(en.research.partnerships.audiences.items)) {
      const audienceArticle = screen.getByRole("heading", { name: audience.title }).closest("article");
      expect(audienceArticle).not.toBeNull();
      expect(within(audienceArticle as HTMLElement).getByText(audience.description)).toBeInTheDocument();
    }

    for (const model of Object.values(en.research.partnerships.models.items)) {
      const modelArticle = screen.getByRole("heading", { name: model.title }).closest("article");
      expect(modelArticle).not.toBeNull();
      expect(within(modelArticle as HTMLElement).getByText(model.description)).toBeInTheDocument();
    }

    const scopeList = screen.getByRole("list", { name: en.research.partnerships.scope.listLabel });
    for (const item of Object.values(en.research.partnerships.scope.items)) {
      expect(within(scopeList).getByText(item)).toBeInTheDocument();
    }

    for (const stage of Object.values(en.research.partnerships.process.stages)) {
      expect(screen.getByRole("heading", { name: stage.title })).toBeInTheDocument();
      expect(screen.getByText(stage.description)).toBeInTheDocument();
    }
  });

  it("uses the trusted contact and project routes for both CTA groups", async () => {
    render(await ResearchPartnershipsPage({ locale: "en" }));

    const discussionLinks = screen.getAllByRole("link", { name: en.research.partnerships.header.primaryAction });
    expect(discussionLinks).toHaveLength(2);
    for (const link of discussionLinks) expect(link).toHaveAttribute("href", "/en/contact");

    expect(screen.getByRole("link", { name: en.research.partnerships.header.secondaryAction })).toHaveAttribute(
      "href",
      "/en/research/projects"
    );
    expect(screen.getByRole("link", { name: en.research.partnerships.final.secondaryAction })).toHaveAttribute(
      "href",
      "/en/research/projects"
    );
  });

  it("uses an honest text ecosystem without unverified partner logos or labels", async () => {
    const view = render(await ResearchPartnershipsPage({ locale: "en" }));

    expect(screen.getByText(en.research.partnerships.ecosystem.description)).toBeInTheDocument();
    expect(view.container.querySelectorAll("img")).toHaveLength(0);
    expect(screen.queryByText("Doğa Koleji")).not.toBeInTheDocument();
    expect(screen.queryByText("Mektebim Koleji")).not.toBeInTheDocument();
    expect(screen.queryByText("Uğur Okulları")).not.toBeInTheDocument();
    expect(screen.queryByText(/existing research partner|trusted research partner/i)).not.toBeInTheDocument();
  });

  it("localizes Arabic content, inherits RTL, and prefixes action routes", async () => {
    const view = render(
      <div dir="rtl">
        {await ResearchPartnershipsPage({ locale: "ar" })}
      </div>
    );

    expect(view.container.firstElementChild).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(ar.research.partnerships.title);
    expect(screen.getByRole("heading", { name: ar.research.partnerships.audiences.items.researchGroups.title })).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: ar.research.partnerships.header.primaryAction })) {
      expect(link).toHaveAttribute("href", "/ar/contact");
    }
    expect(screen.getByRole("link", { name: ar.research.partnerships.final.secondaryAction })).toHaveAttribute(
      "href",
      "/ar/research/projects"
    );
  });

  it("provides complete, non-empty public copy in EN, TR, AR, and FA", () => {
    const required = [
      "title",
      "description",
      "header.visualAriaLabel",
      "audiences.items.universities.description",
      "audiences.items.technologyPartners.title",
      "models.items.jointResearch.description",
      "models.items.education.title",
      "scope.items.problemFraming",
      "scope.items.recommendations",
      "process.stages.discuss.description",
      "process.stages.researchBuild.title",
      "process.stages.continue.description",
      "ecosystem.description",
      "final.primaryAction",
      "final.secondaryAction"
    ];

    for (const locale of ["en", "tr", "ar", "fa"] as const) {
      for (const path of required) {
        const message = resolveMessage(locale, "research.partnerships", path);
        expect(message).not.toBe(`research.partnerships.${path}`);
        expect(message.trim()).not.toBe("");
      }
    }
  });
});
