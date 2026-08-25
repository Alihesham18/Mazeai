import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import fa from "../../messages/fa.json";
import tr from "../../messages/tr.json";

type SupportedLocale = "en" | "tr" | "ar" | "fa";
const catalogs = { en, tr, ar, fa } as const;
const { getPublishedCaseStudies } = vi.hoisted(() => ({ getPublishedCaseStudies: vi.fn() }));

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
vi.mock("@/lib/directus/case-studies", () => ({ getPublishedCaseStudies }));
vi.mock("@/components/case-studies/CaseStudyCoverImage", () => ({
  CaseStudyCoverImage: ({ alt, src }: { alt: string; src: string }) => (
    <span aria-label={alt} data-src={src} role="img" />
  )
}));

import { CaseStudiesOverviewPage } from "@/components/pages/CaseStudiesOverviewPage";

const internalDemonstration = {
  id: "case-1",
  slug: "ai-document-automation",
  featured: true,
  publishedAt: "2026-08-01T00:00:00Z",
  coverImage: null,
  industry: "Technology",
  client: "SynergyMazeAI Demo",
  technologies: ["AI", "Next.js", "Directus", "Automation"],
  locale: "en" as const,
  title: "AI Document Automation Platform",
  shortDescription: "An AI-powered platform designed to automate document analysis and reduce manual processing.",
  challenge: "Teams were reviewing documents manually.",
  solution: "An AI-assisted workflow.",
  results: "An unverified qualitative outcome.",
  content: "Placeholder content"
};

describe("Selected Work overview", () => {
  beforeEach(() => getPublishedCaseStudies.mockReset());

  it("renders one intentional internal demonstration without a misleading client", async () => {
    getPublishedCaseStudies.mockResolvedValue({ ok: true, data: [internalDemonstration] });
    render(await CaseStudiesOverviewPage({ locale: "en" }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.caseStudies.pageTitle);
    const record = screen.getByRole("heading", { name: internalDemonstration.title }).closest("article");
    expect(record).not.toBeNull();
    expect(within(record as HTMLElement).getAllByText(en.caseStudies.projectTypes.internalDemonstration).length).toBeGreaterThan(0);
    expect(within(record as HTMLElement).getByText(internalDemonstration.shortDescription)).toBeInTheDocument();
    expect(within(record as HTMLElement).queryByText("SynergyMazeAI Demo")).not.toBeInTheDocument();
    expect(within(record as HTMLElement).queryByText(en.caseStudies.client)).not.toBeInTheDocument();

    for (const technology of internalDemonstration.technologies) {
      expect(within(record as HTMLElement).getByText(technology)).toBeInTheDocument();
    }
    expect(within(record as HTMLElement).getByRole("img", {
      name: en.caseStudies.visualLabel.replace("{title}", internalDemonstration.title)
    })).toBeInTheDocument();
    expect(within(record as HTMLElement).getByRole("link", { name: en.caseStudies.viewDemonstration })).toHaveAttribute(
      "href",
      "/en/case-studies/ai-document-automation"
    );
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("link", { name: en.caseStudies.cta.services })).toHaveAttribute("href", "/en/services");
    expect(screen.getByRole("link", { name: en.caseStudies.cta.contact })).toHaveAttribute("href", "/en/contact");
  });

  it("localizes Arabic copy, preserves the locale route, and inherits RTL", async () => {
    getPublishedCaseStudies.mockResolvedValue({
      ok: true,
      data: [{ ...internalDemonstration, locale: "ar", title: "منصة أتمتة المستندات" }]
    });
    const view = render(<div dir="rtl">{await CaseStudiesOverviewPage({ locale: "ar" })}</div>);

    expect(view.container.firstElementChild).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(ar.caseStudies.pageTitle);
    expect(screen.getAllByText(ar.caseStudies.projectTypes.internalDemonstration).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: ar.caseStudies.viewDemonstration })).toHaveAttribute(
      "href",
      "/ar/case-studies/ai-document-automation"
    );
  });

  it("renders safe empty and error states", async () => {
    getPublishedCaseStudies.mockResolvedValueOnce({ ok: true, data: [] });
    const empty = render(await CaseStudiesOverviewPage({ locale: "en" }));
    expect(screen.getByText(en.caseStudies.empty)).toBeInTheDocument();
    empty.unmount();

    getPublishedCaseStudies.mockResolvedValueOnce({ ok: false, error: "requestFailed" });
    render(await CaseStudiesOverviewPage({ locale: "en" }));
    expect(screen.getByRole("alert")).toHaveTextContent(en.caseStudies.unableToLoad);
  });

  it("provides the selected-work experience copy in every supported locale", () => {
    const required = [
      "pages.caseStudies.title",
      "pages.caseStudies.description",
      "caseStudies.pageTitle",
      "caseStudies.collectionDescription",
      "caseStudies.projectTypes.internalDemonstration",
      "caseStudies.visualLabel",
      "caseStudies.workflow.analyze",
      "caseStudies.disclosure",
      "caseStudies.cta.services",
      "caseStudies.detail.demonstrationScopeDescription"
    ];

    for (const locale of ["en", "tr", "ar", "fa"] as const) {
      for (const path of required) {
        const message = resolveMessage(locale, undefined, path);
        expect(message).not.toBe(path);
        expect(message.trim()).not.toBe("");
      }
    }
  });
});
