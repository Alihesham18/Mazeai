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

import ResearchPage from "@/app/[locale]/research/page";

describe("R&D overview", () => {
  it("renders the complete English laboratory experience with trusted project data", async () => {
    const view = render(await ResearchPage({ params: { locale: "en" } }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.research.overview.header.title);
    expect(screen.getByRole("heading", { name: en.research.overview.domains.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.research.overview.projects.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.research.overview.approach.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.research.overview.partnerships.title })).toBeInTheDocument();

    expect(screen.getByRole("link", { name: en.research.overview.partnerships.action })).toHaveAttribute(
      "href",
      "/en/research/partnerships"
    );
    expect(screen.getByRole("link", { name: en.research.overview.partnerships.contact })).toHaveAttribute(
      "href",
      "/en/contact"
    );

    for (const project of activeResearchProjects) {
      expect(screen.getAllByRole("heading", { name: project.name })).toHaveLength(1);
      expect(
        screen.getByRole("link", {
          name: en.research.overview.projects.viewProject.replace("{project}", project.name)
        })
      ).toHaveAttribute("href", `/en/research/projects/${project.slug}`);
      expect(view.container).toHaveTextContent(project.description.en);
    }

    const featured = view.container.querySelector('[data-featured="true"]');
    expect(featured).not.toBeNull();
    expect(within(featured as HTMLElement).getByRole("heading", { name: "BioPredict" })).toBeInTheDocument();
    expect(view.container.querySelectorAll('[data-size="supporting"]')).toHaveLength(4);
    expect(screen.getByRole("img", { name: en.research.overview.visual.ariaLabel })).toBeInTheDocument();
    expect(view.container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders localized Arabic content and locale-prefixed project links in RTL context", async () => {
    const view = render(<div dir="rtl">{await ResearchPage({ params: { locale: "ar" } })}</div>);

    expect(view.container.firstElementChild).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(ar.research.overview.header.title);
    expect(screen.getByRole("heading", { name: ar.research.overview.domains.items.computerVision.title })).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: ar.research.overview.projects.viewProject.replace("{project}", "BioPredict")
      })
    ).toHaveAttribute("href", "/ar/research/projects/biopredict");
  });

  it("provides the complete R&D overview message structure in every locale", () => {
    const requiredPaths = [
      "header.title",
      "header.metadata.program.value",
      "visual.ariaLabel",
      "domains.items.machineLearning.title",
      "domains.items.computerVision.title",
      "domains.items.aiSystems.title",
      "domains.items.appliedAIResearch.title",
      "projects.viewProject",
      "approach.stages.discover.title",
      "approach.stages.develop.title",
      "approach.stages.validate.title",
      "approach.stages.deploy.title",
      "partnerships.groups.universities.title",
      "partnerships.groups.organizations.title",
      "partnerships.groups.collaboration.title",
      "partnerships.action",
      "partnerships.contact"
    ];

    for (const locale of ["en", "tr", "ar", "fa"] as const) {
      for (const path of requiredPaths) {
        expect(resolveMessage(locale, "research.overview", path)).not.toBe(
          `research.overview.${path}`
        );
      }
    }
  });
});
