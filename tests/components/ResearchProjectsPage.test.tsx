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

import ResearchProjectsPage from "@/app/[locale]/research/projects/page";

describe("Research Projects portfolio", () => {
  it("renders one H1, a real-data console, BioPredict feature, and four portfolio records", async () => {
    render(await ResearchProjectsPage({ params: { locale: "en" } }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.research.projects.title);
    expect(screen.getByRole("img", { name: en.research.projects.console.ariaLabel })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: en.research.projects.categories.ariaLabel })).toBeInTheDocument();

    const featured = screen.getByRole("heading", { name: "BioPredict" }).closest("article");
    expect(featured).not.toBeNull();
    expect(within(featured as HTMLElement).getByText(en.research.projects.featured.focus)).toBeInTheDocument();
    expect(within(featured as HTMLElement).getByText(activeResearchProjects[0].description.en)).toBeInTheDocument();
    expect(within(featured as HTMLElement).getByRole("link", { name: en.research.projects.featured.action })).toHaveAttribute(
      "href",
      "/en/research/projects/biopredict"
    );

    for (const project of activeResearchProjects.slice(1)) {
      const record = screen.getByRole("heading", { name: project.name }).closest("article");
      expect(record).not.toBeNull();
      expect(within(record as HTMLElement).getByText(project.description.en)).toBeInTheDocument();
      expect(
        within(record as HTMLElement).getByRole("link", {
          name: en.research.projects.portfolio.viewProject.replace("{project}", project.name)
        })
      ).toHaveAttribute("href", `/en/research/projects/${project.slug}`);
      expect(within(record as HTMLElement).getAllByRole("listitem")).toHaveLength(3);
    }

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(5);
  });

  it("localizes the Arabic portfolio, routes, categories, and collaboration actions", async () => {
    const view = render(<div dir="rtl">{await ResearchProjectsPage({ params: { locale: "ar" } })}</div>);

    expect(view.container.firstElementChild).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(ar.research.projects.title);
    expect(screen.getByText(ar.research.projects.categories.items.appliedAI)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: ar.research.projects.collaboration.discussion })).toHaveAttribute(
      "href",
      "/ar/contact"
    );
    expect(screen.getByRole("link", { name: ar.research.projects.collaboration.partnerships })).toHaveAttribute(
      "href",
      "/ar/research/partnerships"
    );
  });

  it("provides portfolio copy in every supported locale", () => {
    const required = [
      "title",
      "description",
      "console.ariaLabel",
      "categories.items.all",
      "categories.items.machineLearning",
      "categories.items.computerVision",
      "categories.items.aiSystems",
      "categories.items.appliedAI",
      "featured.focus",
      "portfolio.viewProject",
      "collaboration.discussion",
      "collaboration.partnerships"
    ];

    for (const locale of ["en", "tr", "ar", "fa"] as const) {
      for (const path of required) {
        expect(resolveMessage(locale, "research.projects", path)).not.toBe(`research.projects.${path}`);
      }
    }
  });
});
