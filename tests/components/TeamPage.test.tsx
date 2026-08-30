import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import fa from "../../messages/fa.json";
import tr from "../../messages/tr.json";
import type { Locale } from "@/i18n/routing";
import type { TeamMember } from "@/lib/directus/team";

const catalogs = { en, tr, ar, fa } as const;

function resolveMessage(locale: Locale, namespace: string | undefined, key: string) {
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
    async ({ locale, namespace }: { locale: Locale; namespace?: string }) =>
      (key: string, values?: Record<string, string>) => {
        let message = resolveMessage(locale, namespace, key);
        for (const [name, value] of Object.entries(values ?? {})) {
          message = message.replace(`{${name}}`, value);
        }
        return message;
      }
  )
}));

import { TeamPage } from "@/components/pages/TeamPage";

const members: TeamMember[] = [
  {
    id: "mahyar",
    slug: "mahyar-teymournezhad",
    fullName: "Mahyar Teymournezhad",
    photoUrl: "/images/team/mahyar-teymournezhad.jpg",
    photoAlt: "Portrait of Mahyar Teymournezhad",
    linkedinUrl: "https://www.linkedin.com/in/mahyarteymournezhad",
    category: "leadership",
    locale: "en",
    jobTitle: "Founder & CEO",
    bio: "Mahyar leads MazeAI's work across artificial intelligence, technology and education.",
    expertise: ["Leadership", "Artificial Intelligence", "R&D", "Strategy"]
  },
  {
    id: "ozgur",
    slug: "ozgur-koray-sahingoz",
    fullName: "Prof. Dr. Özgür Koray Şahingöz",
    photoUrl: "/images/team/ozgur-koray-sahingoz.jpg",
    photoAlt: "Portrait of Prof. Dr. Özgür Koray Şahingöz",
    linkedinUrl: "https://www.linkedin.com/in/sahingoz",
    category: "research_advisory",
    locale: "en",
    jobTitle: "Academic Advisor",
    bio: "Professor Şahingöz contributes academic perspective in artificial intelligence and computer engineering.",
    expertise: ["Research", "Artificial Intelligence", "Academia", "Mentorship"]
  }
];

afterEach(cleanup);

describe("Team page", () => {
  it("renders the two exact Directus-backed profiles and safe LinkedIn actions", async () => {
    render(await TeamPage({ locale: "en", result: { ok: true, data: members } }));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.pages.team.hero.title);
    const grid = screen.getByTestId("team-grid");
    expect(within(grid).getAllByRole("article")).toHaveLength(2);

    for (const member of members) {
      const heading = within(grid).getByRole("heading", { name: member.fullName });
      const article = heading.closest("article");
      expect(article).not.toBeNull();
      const profile = within(article as HTMLElement);
      expect(heading).toBeVisible();
      expect(profile.getByText(member.jobTitle)).toBeVisible();
      expect(profile.getByText(member.bio)).toBeVisible();
      expect(profile.getByAltText(member.photoAlt)).toBeVisible();
      const expertiseList = profile.getByRole("list");
      for (const expertise of member.expertise) {
        expect(within(expertiseList).getByText(expertise)).toBeVisible();
      }
      expect(
        profile.getByRole("link", { name: `View ${member.fullName} on LinkedIn` })
      ).toHaveAttribute("href", member.linkedinUrl);
      expect(
        profile.getByRole("link", { name: `View ${member.fullName} on LinkedIn` })
      ).toHaveAttribute("target", "_blank");
      expect(
        profile.getByRole("link", { name: `View ${member.fullName} on LinkedIn` })
      ).toHaveAttribute("rel", "noopener noreferrer");
    }

    expect(screen.queryByText(/profile slot|placeholder/i)).not.toBeInTheDocument();
  });

  it.each([
    ["en", "ltr"],
    ["tr", "ltr"],
    ["ar", "rtl"],
    ["fa", "rtl"]
  ] as const)("renders localized interface content for %s in %s", async (locale, direction) => {
    const messages = catalogs[locale].pages.team;
    const view = render(
      <div dir={direction}>{await TeamPage({ locale, result: { ok: true, data: members } })}</div>
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(messages.hero.title);
    expect(screen.getByRole("heading", { level: 2, name: messages.directory.title })).toBeVisible();
    expect(screen.getByRole("link", { name: messages.cta.button })).toHaveAttribute(
      "href",
      `/${locale}/contact`
    );
    expect(view.container.firstElementChild).toHaveAttribute("dir", direction);
  });

  it("renders localized empty and failure states without fake profiles", async () => {
    const empty = render(await TeamPage({ locale: "en", result: { ok: true, data: [] } }));
    expect(screen.getByText(en.pages.team.empty.title)).toBeVisible();
    expect(empty.queryByTestId("team-grid")).not.toBeInTheDocument();
    cleanup();

    const failure = render(
      await TeamPage({ locale: "en", result: { ok: false, error: "requestFailed" } })
    );
    expect(screen.getByText(en.pages.team.failure.title)).toBeVisible();
    expect(failure.queryByTestId("team-grid")).not.toBeInTheDocument();
  });

  it("keeps all locale catalogs structurally aligned", () => {
    const keys = Object.keys(en.pages.team).sort();
    for (const locale of ["tr", "ar", "fa"] as const) {
      expect(Object.keys(catalogs[locale].pages.team).sort()).toEqual(keys);
      expect(Object.keys(catalogs[locale].pages.team.categories)).toEqual(
        Object.keys(en.pages.team.categories)
      );
    }
  });
});
