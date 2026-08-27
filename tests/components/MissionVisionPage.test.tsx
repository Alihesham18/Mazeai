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

import MissionVisionPage from "@/app/[locale]/about/mission-vision/page";

afterEach(cleanup);

describe("Mission and Vision page", () => {
  it("renders the full editorial content structure in English", async () => {
    const messages = en.pages.missionVision;
    const view = render(await MissionVisionPage({ params: { locale: "en" } }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(messages.hero.title);

    const intent = screen.getByRole("region", { name: messages.intentAriaLabel });
    expect(within(intent).getByRole("heading", { name: messages.mission.statement })).toBeVisible();
    expect(within(intent).getByRole("heading", { name: messages.vision.statement })).toBeVisible();

    const principleTitles = Object.values(messages.principles.items).map((item) => item.title);
    for (const title of principleTitles) {
      expect(screen.getByRole("heading", { name: title })).toBeVisible();
    }

    const process = screen.getByRole("list", { name: messages.process.flowAriaLabel });
    expect(within(process).getAllByRole("listitem")).toHaveLength(5);

    const audienceTitles = Object.values(messages.support.items).map((item) => item.title);
    for (const title of audienceTitles) {
      expect(screen.getByRole("heading", { name: title })).toBeVisible();
    }

    expect(screen.getByLabelText(messages.direction.visualAriaLabel)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.cta.button })).toHaveAttribute(
      "href",
      "/en/contact"
    );

    const decorativeImages = Array.from(view.container.querySelectorAll('img[alt=""]'));
    expect(decorativeImages).toHaveLength(4);
  });

  it.each([
    ["en", "ltr"],
    ["tr", "ltr"],
    ["ar", "rtl"],
    ["fa", "rtl"]
  ] as const)("renders localized content and CTA for %s", async (locale, direction) => {
    const messages = catalogs[locale].pages.missionVision;
    const view = render(
      <div dir={direction}>{await MissionVisionPage({ params: { locale } })}</div>
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(messages.hero.title);
    expect(screen.getByText(messages.mission.label)).toBeInTheDocument();
    expect(screen.getByText(messages.vision.label)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.cta.button })).toHaveAttribute(
      "href",
      `/${locale}/contact`
    );
    expect(view.container.firstElementChild).toHaveAttribute("dir", direction);
  });

  it("keeps all localized Mission and Vision catalogs structurally aligned", () => {
    const reference = Object.keys(en.pages.missionVision).sort();

    for (const locale of ["tr", "ar", "fa"] as const) {
      expect(Object.keys(catalogs[locale].pages.missionVision).sort()).toEqual(reference);
      expect(Object.keys(catalogs[locale].pages.missionVision.principles.items)).toEqual(
        Object.keys(en.pages.missionVision.principles.items)
      );
      expect(Object.keys(catalogs[locale].pages.missionVision.process.steps)).toEqual(
        Object.keys(en.pages.missionVision.process.steps)
      );
      expect(Object.keys(catalogs[locale].pages.missionVision.support.items)).toEqual(
        Object.keys(en.pages.missionVision.support.items)
      );
    }
  });
});
