import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import fa from "../../messages/fa.json";
import tr from "../../messages/tr.json";
import { activeResearchProjects } from "@/data/active-research-projects";

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

import ResearchProjectPage, {
  generateMetadata,
  generateStaticParams
} from "@/app/[locale]/research/projects/[slug]/page";

describe("Research Project detail", () => {
  it("renders BioPredict as an accessible research record using only its trusted dataset", async () => {
    const project = activeResearchProjects[0];
    render(await ResearchProjectPage({ params: { locale: "en", slug: project.slug } }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(project.name);
    expect(screen.getByRole("img", { name: `Technical research diagram for ${project.name}` })).toBeInTheDocument();
    expect(screen.getAllByText(project.description.en)).toHaveLength(2);

    for (const objective of project.objectives) {
      expect(screen.getByText(objective.en)).toBeInTheDocument();
    }
    for (const technology of project.technologies) {
      expect(screen.getByText(technology)).toBeInTheDocument();
    }

    expect(screen.getAllByText("Active R&D").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/team member/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/award|client|success rate/i)).not.toBeInTheDocument();
  });

  it("links to the four other real projects and keeps every route locale-prefixed", async () => {
    const current = activeResearchProjects[0];
    render(await ResearchProjectPage({ params: { locale: "en", slug: current.slug } }));

    const related = screen.getByRole("navigation", { name: en.research.detail.related.title });
    expect(within(related).queryByText(current.name)).not.toBeInTheDocument();

    for (const project of activeResearchProjects.slice(1)) {
      expect(within(related).getByRole("link", { name: new RegExp(project.name) })).toHaveAttribute(
        "href",
        `/en/research/projects/${project.slug}`
      );
    }

    expect(within(related).getAllByRole("link")).toHaveLength(4);
    expect(screen.getByRole("link", { name: en.research.detail.collaboration.partnerships })).toHaveAttribute(
      "href",
      "/en/research/partnerships"
    );
    expect(screen.getByRole("link", { name: en.research.detail.collaboration.contact })).toHaveAttribute(
      "href",
      "/en/contact"
    );
  });

  it("preserves Arabic content, RTL inheritance, and localized project routes", async () => {
    const project = activeResearchProjects[2];
    const view = render(
      <div dir="rtl">
        {await ResearchProjectPage({ params: { locale: "ar", slug: project.slug } })}
      </div>
    );

    expect(view.container.firstElementChild).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(project.name);
    expect(screen.getAllByText(project.description.ar)).toHaveLength(2);
    expect(screen.getByRole("link", { name: ar.research.detail.collaboration.partnerships })).toHaveAttribute(
      "href",
      "/ar/research/partnerships"
    );
    expect(screen.getByRole("link", { name: ar.research.detail.collaboration.contact })).toHaveAttribute(
      "href",
      "/ar/contact"
    );
  });

  it("provides complete detail-page copy in every supported locale", () => {
    const required = [
      "visualAriaLabel",
      "overview.eyebrow",
      "overview.title",
      "overview.question",
      "challenge.introduction",
      "methodology.description",
      "methodology.stages.research.title",
      "methodology.stages.development.title",
      "methodology.stages.validation.title",
      "methodology.stages.application.title",
      "technology.stack",
      "status.description",
      "related.title",
      "collaboration.partnerships",
      "collaboration.contact"
    ];

    for (const locale of ["en", "tr", "ar", "fa"] as const) {
      for (const path of required) {
        expect(resolveMessage(locale, "research.detail", path)).not.toBe(`research.detail.${path}`);
        expect(resolveMessage(locale, "research.detail", path).trim()).not.toBe("");
      }
    }
  });

  it("pre-renders and describes every valid research project route", () => {
    expect(generateStaticParams()).toEqual(activeResearchProjects.map(({ slug }) => ({ slug })));

    for (const project of activeResearchProjects) {
      expect(generateMetadata({ params: { locale: "en", slug: project.slug } })).toEqual({
        title: `${project.name} | SynergyMazeAI`,
        description: project.description.en
      });
    }
  });
});
