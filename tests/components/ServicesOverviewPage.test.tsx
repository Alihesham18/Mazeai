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

import ServicesPage from "@/app/[locale]/services/page";

describe("Services overview", () => {
  it("renders one H1, editorial philosophy, and exactly three service gateways", async () => {
    const view = render(await ServicesPage({ params: { locale: "en" } }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.services.overview.title);
    expect(screen.getByRole("heading", { name: en.services.overview.philosophy.title })).toBeInTheDocument();
    expect(view.container.querySelectorAll("blockquote")).toHaveLength(3);
    expect(view.container.querySelectorAll("cite")).toHaveLength(0);

    expect(screen.getByRole("heading", { name: en.services.webDevelopment.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.services.webDesign.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.services.aiConsulting.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.services.overview.explore.webDevelopment })).toHaveAttribute(
      "href",
      "/en/services/web-development"
    );
    expect(screen.getByRole("link", { name: en.services.overview.explore.webDesign })).toHaveAttribute(
      "href",
      "/en/services/web-design"
    );
    expect(screen.getByRole("link", { name: en.services.overview.explore.aiConsulting })).toHaveAttribute(
      "href",
      "/en/services/ai-consulting"
    );
  });

  it("renders the Arabic directory and localized service routes in an RTL context", async () => {
    const view = render(<div dir="rtl">{await ServicesPage({ params: { locale: "ar" } })}</div>);

    expect(view.container.firstElementChild).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(ar.services.overview.title);
    expect(screen.getByRole("heading", { name: ar.services.aiConsulting.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: ar.services.overview.explore.aiConsulting })).toHaveAttribute(
      "href",
      "/ar/services/ai-consulting"
    );
  });
});
