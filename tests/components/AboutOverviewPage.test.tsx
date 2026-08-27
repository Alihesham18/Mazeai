import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  getTranslations: vi.fn(
    async ({ locale, namespace }: { locale: SupportedLocale; namespace?: string }) =>
      (key: string) =>
        resolveMessage(locale, namespace, key)
  )
}));

import AboutPage from "@/app/[locale]/about/page";

afterEach(cleanup);

describe("About overview", () => {
  it("preserves the completed hero and renders four numbered framework cards", async () => {
    const view = render(await AboutPage({ params: { locale: "en" } }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Who We Are");
    expect(screen.getByText(en.pages.about.hero.lead)).toBeInTheDocument();
    expect(screen.getByText(en.pages.about.hero.location)).toBeInTheDocument();

    const framework = screen.getByRole("region", {
      name: en.pages.about.frameworkLabel
    });
    const cards = within(framework).getAllByRole("article");
    expect(cards).toHaveLength(4);

    for (const [index, key] of ["connect", "work", "support", "responsibility"].entries()) {
      const content = en.pages.about[key as keyof typeof en.pages.about] as {
        title: string;
        description: string;
        detail: string;
      };
      expect(
        within(cards[index]).getByText(String(index + 1).padStart(2, "0"))
      ).toBeInTheDocument();
      expect(
        within(cards[index]).getByRole("heading", { name: content.title })
      ).toBeInTheDocument();
      expect(within(cards[index]).getByText(content.description)).toBeInTheDocument();
      expect(within(cards[index]).getByText(content.detail)).toBeInTheDocument();
    }

    const decorativeImages = Array.from(view.container.querySelectorAll('img[alt=""]'));
    expect(decorativeImages).toHaveLength(4);
    expect(
      decorativeImages.some((image) => image.getAttribute("src")?.includes("about-cta-light"))
    ).toBe(true);
    expect(
      decorativeImages.some((image) => image.getAttribute("src")?.includes("about-cta-dark"))
    ).toBe(true);
    expect(screen.getByRole("link", { name: en.pages.about.cta.button })).toHaveAttribute(
      "href",
      "/en/contact"
    );
  });

  it.each([
    ["en", "Who We Are", "ltr"],
    ["tr", "Biz Kimiz", "ltr"],
    ["ar", "من نحن", "rtl"],
    ["fa", "ما که هستیم", "rtl"]
  ] as const)(
    "renders the approved %s hero title and localized CTA",
    async (locale, title, dir) => {
      const messages = catalogs[locale].pages.about;
      const view = render(<div dir={dir}>{await AboutPage({ params: { locale } })}</div>);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(title);
      expect(screen.getByRole("heading", { name: messages.overview.title })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: messages.cta.button })).toHaveAttribute(
        "href",
        `/${locale}/contact`
      );
      expect(view.container.firstElementChild).toHaveAttribute("dir", dir);

      cleanup();
    }
  );
});
