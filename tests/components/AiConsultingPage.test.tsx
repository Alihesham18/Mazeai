import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(
    async ({ locale, namespace }: { locale: "en" | "ar"; namespace?: string }) => {
      const messages = locale === "ar" ? ar : en;

      return (key: string) => {
        const path = namespace ? `${namespace}.${key}` : key;
        const value = path.split(".").reduce<unknown>((current, part) => {
          if (typeof current !== "object" || current === null) return undefined;
          return (current as Record<string, unknown>)[part];
        }, messages);

        return typeof value === "string" ? value : path;
      };
    }
  )
}));

import AiConsultingPage from "@/app/[locale]/services/ai-consulting/page";

describe("AI Consulting page", () => {
  it("renders the service architecture, trusted routes, and one H1", async () => {
    render(await AiConsultingPage({ params: { locale: "en" } }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.services.aiConsulting.title);
    expect(screen.getByRole("heading", { name: en.services.aiConsulting.capabilities.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.services.aiConsulting.process.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.services.aiConsulting.deliverables.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.services.aiConsulting.audience.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.services.aiConsulting.ctaTitle })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: en.services.aiConsulting.heroPrimary })[0]).toHaveAttribute(
      "href",
      "/en/contact"
    );
    expect(screen.getByRole("link", { name: en.services.common.backToServices })).toHaveAttribute(
      "href",
      "/en/services"
    );
  });

  it("renders complete Arabic consulting content and RTL-safe destinations", async () => {
    const view = render(
      <div dir="rtl">{await AiConsultingPage({ params: { locale: "ar" } })}</div>
    );

    expect(view.container.firstElementChild).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(ar.services.aiConsulting.title);
    expect(screen.getByRole("heading", { name: ar.services.aiConsulting.process.title })).toBeInTheDocument();
    expect(screen.getByText(ar.services.aiConsulting.deliverables.items.one)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: ar.services.aiConsulting.ctaPrimary }).at(-1)).toHaveAttribute(
      "href",
      "/ar/contact"
    );
    expect(
      screen.getAllByRole("link", { name: ar.services.aiConsulting.ctaSecondary }).at(-1)
    ).toHaveAttribute("href", "/ar/services");
  });
});
