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
vi.mock("@/components/case-studies/CaseStudyCoverImage", () => ({
  CaseStudyCoverImage: ({ alt, src }: { alt: string; src: string }) => (
    <span aria-label={alt} data-src={src} role="img" />
  )
}));

import { CaseStudyDetailPage } from "@/components/pages/CaseStudyDetailPage";

const internalDemonstration = {
  id: "case-1",
  slug: "ai-document-automation",
  featured: true,
  publishedAt: null,
  coverImage: null,
  industry: "Technology",
  client: "SynergyMazeAI Demo",
  technologies: ["AI", "Next.js", "Directus", "Automation"],
  locale: "en" as const,
  title: "AI Document Automation Platform",
  shortDescription: "An AI-powered platform designed to automate document analysis and reduce manual processing.",
  challenge: "Teams were spending significant time reviewing and processing documents manually.",
  solution: "SynergyMazeAI developed an AI-assisted workflow that analyzes, organizes, and processes documents automatically.",
  results: "Reduced repetitive manual work and improved document-processing efficiency.",
  content: "A longer description of the project can go here. For now, a short paragraph is enough for testing."
};

describe("Selected Work detail page", () => {
  it("renders the truthful internal concept narrative from trusted server data", async () => {
    render(await CaseStudyDetailPage({ caseStudy: internalDemonstration, locale: "en" }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(internalDemonstration.title);
    expect(screen.getAllByText(en.caseStudies.projectTypes.internalDemonstration).length).toBeGreaterThan(0);
    expect(screen.queryByText("SynergyMazeAI Demo")).not.toBeInTheDocument();
    expect(screen.queryByText(en.caseStudies.client)).not.toBeInTheDocument();
    expect(screen.getByText(internalDemonstration.challenge)).toBeInTheDocument();
    expect(screen.getByText(internalDemonstration.solution)).toBeInTheDocument();
    expect(screen.getAllByText(internalDemonstration.shortDescription)).toHaveLength(2);
    expect(screen.queryByText(internalDemonstration.content)).not.toBeInTheDocument();
    expect(screen.queryByText(internalDemonstration.results)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: en.caseStudies.results })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.caseStudies.detail.demonstrationScope })).toBeInTheDocument();

    const stack = screen.getByRole("heading", { name: en.caseStudies.detail.technologies }).closest("section");
    expect(stack).not.toBeNull();
    for (const technology of internalDemonstration.technologies) {
      expect(within(stack as HTMLElement).getByText(technology)).toBeInTheDocument();
    }

    expect(screen.getByRole("img", {
      name: en.caseStudies.visualLabel.replace("{title}", internalDemonstration.title)
    })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.caseStudies.back })).toHaveAttribute("href", "/en/case-studies");
    expect(screen.getByRole("link", { name: en.caseStudies.cta.services })).toHaveAttribute("href", "/en/services");
    expect(screen.getByRole("link", { name: en.caseStudies.detail.startConversation })).toHaveAttribute("href", "/en/contact");
  });

  it("omits optional sections and visual image safely when source fields are absent", async () => {
    render(await CaseStudyDetailPage({
      locale: "fa",
      caseStudy: {
        ...internalDemonstration,
        locale: "fa",
        title: "عنوان فارسی",
        technologies: [],
        shortDescription: null,
        challenge: null,
        solution: null,
        results: null,
        content: null
      }
    }));

    expect(screen.queryByRole("heading", { name: fa.caseStudies.detail.projectOverview })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: fa.caseStudies.detail.problemOpportunity })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: fa.caseStudies.detail.conceptApproach })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: fa.caseStudies.detail.technologies })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: fa.caseStudies.detail.demonstrationScope })).toBeInTheDocument();
  });

  it("localizes the Arabic narrative, links, and RTL wrapper", async () => {
    const localized = {
      ...internalDemonstration,
      locale: "ar" as const,
      title: "منصة أتمتة المستندات",
      shortDescription: "منصة مدعومة بالذكاء الاصطناعي لتحليل المستندات."
    };
    const view = render(<div dir="rtl">{await CaseStudyDetailPage({ caseStudy: localized, locale: "ar" })}</div>);

    expect(view.container.firstElementChild).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(localized.title);
    expect(screen.getByRole("heading", { name: ar.caseStudies.detail.systemFlow })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: ar.caseStudies.back })).toHaveAttribute("href", "/ar/case-studies");
    expect(screen.getByRole("link", { name: ar.caseStudies.detail.startConversation })).toHaveAttribute("href", "/ar/contact");
  });
});
