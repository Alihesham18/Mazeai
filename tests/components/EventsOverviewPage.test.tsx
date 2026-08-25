import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import fa from "../../messages/fa.json";
import tr from "../../messages/tr.json";
import type { DirectusEvent } from "@/lib/directus/types";

type SupportedLocale = "en" | "tr" | "ar" | "fa";

const catalogs = { en, tr, ar, fa } as const;
const { getPublishedEvents } = vi.hoisted(() => ({ getPublishedEvents: vi.fn() }));

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
vi.mock("@/lib/directus/events", () => ({ getPublishedEvents }));

import { EventsOverviewPage } from "@/components/pages/EventsOverviewPage";

function event(overrides: Partial<DirectusEvent> = {}): DirectusEvent {
  return {
    id: 7,
    slug: "future-of-ai",
    title: "Future of AI",
    short_description: "A published Directus event",
    description: "Full description",
    event_date: "2026-09-20T15:00:00Z",
    end_date: null,
    location: "Istanbul",
    format: "Hybrid",
    image_url: null,
    registration_open: true,
    capacity: null,
    status: "published",
    ...overrides
  };
}

describe("Events overview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-25T10:00:00Z"));
    getPublishedEvents.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it("renders one upcoming event as the featured program entry with semantic links", async () => {
    getPublishedEvents.mockResolvedValue({ ok: true, data: [event()] });

    const view = render(await EventsOverviewPage({ locale: "en" }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(en.events.overview.header.title);
    expect(screen.getByRole("img", { name: en.events.overview.header.consoleLabel })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Future of AI" })).toBeInTheDocument();
    expect(screen.getByText("A published Directus event")).toBeInTheDocument();
    expect(screen.getByText("Istanbul")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Future of AI" })).toHaveAttribute(
      "href",
      "/en/events/future-of-ai"
    );
    expect(screen.getByRole("link", { name: "Register for Future of AI" })).toHaveAttribute(
      "href",
      "/en/events/future-of-ai#registration"
    );
    expect(view.container.querySelectorAll("article")).toHaveLength(1);
  });

  it("features the nearest event, renders the remaining schedule, and archives only real past events", async () => {
    const nearest = event({
      id: 8,
      slug: "nearest",
      title: "Nearest Event",
      event_date: "2026-09-01T12:00:00Z",
      registration_open: false
    });
    const later = event({
      id: 9,
      slug: "later",
      title: "Later Event",
      event_date: "2026-10-12T09:30:00Z"
    });
    const past = event({
      id: 6,
      slug: "past-event",
      title: "Past Event",
      event_date: "2026-06-10T10:00:00Z",
      registration_open: true
    });
    getPublishedEvents.mockResolvedValue({ ok: true, data: [later, past, nearest] });

    render(await EventsOverviewPage({ locale: "en" }));

    const featured = screen.getByRole("heading", { name: "Nearest Event" }).closest("article");
    expect(featured).not.toBeNull();
    expect(within(featured as HTMLElement).queryByRole("link", { name: "Register for Nearest Event" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.events.overview.upcoming.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Later Event" })).toHaveAttribute("href", "/en/events/later");
    expect(screen.getByRole("link", { name: "Register for Later Event" })).toHaveAttribute(
      "href",
      "/en/events/later#registration"
    );
    expect(screen.getByRole("heading", { name: en.events.overview.archive.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Past Event" })).toHaveAttribute(
      "href",
      "/en/events/past-event"
    );
    expect(screen.queryByRole("link", { name: "Register for Past Event" })).not.toBeInTheDocument();
  });

  it("renders a high-quality empty state when Directus has no published events", async () => {
    getPublishedEvents.mockResolvedValue({ ok: true, data: [] });

    render(await EventsOverviewPage({ locale: "en" }));

    expect(screen.getByRole("heading", { name: en.events.overview.emptyTitle })).toBeInTheDocument();
    expect(screen.getByText(en.events.overview.emptyDescription)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: en.events.overview.archive.title })).not.toBeInTheDocument();
  });

  it("keeps real past events accessible when there is no upcoming program", async () => {
    getPublishedEvents.mockResolvedValue({
      ok: true,
      data: [event({ slug: "archive-only", title: "Archive Only", event_date: "2025-01-10T10:00:00Z" })]
    });

    render(await EventsOverviewPage({ locale: "en" }));

    expect(screen.getByRole("heading", { name: en.events.overview.emptyTitle })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.events.overview.archive.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Archive Only" })).toHaveAttribute(
      "href",
      "/en/events/archive-only"
    );
  });

  it("renders a safe load failure state", async () => {
    getPublishedEvents.mockResolvedValue({ ok: false, error: "requestFailed" });

    render(await EventsOverviewPage({ locale: "en" }));

    expect(screen.getByRole("alert")).toHaveTextContent(en.events.unableToLoadEvents);
  });

  it("localizes Arabic copy and event routes inside an inherited RTL context", async () => {
    getPublishedEvents.mockResolvedValue({ ok: true, data: [event()] });

    const view = render(<div dir="rtl">{await EventsOverviewPage({ locale: "ar" })}</div>);

    expect(view.container.firstElementChild).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(ar.events.overview.header.title);
    expect(screen.getByRole("link", { name: `عرض ${event().title}` })).toHaveAttribute(
      "href",
      "/ar/events/future-of-ai"
    );
    expect(screen.getByRole("link", { name: ar.events.overview.cta.action })).toHaveAttribute(
      "href",
      "/ar/contact"
    );
  });

  it("provides complete event-program copy in every supported locale", () => {
    const requiredPaths = [
      "header.overline",
      "header.title",
      "header.description",
      "header.consoleLabel",
      "emptyTitle",
      "emptyDescription",
      "featured.overline",
      "featured.status",
      "upcoming.title",
      "archive.title",
      "archive.description",
      "meta.time",
      "meta.location",
      "meta.format",
      "actions.view",
      "actions.viewNamed",
      "actions.registerNamed",
      "cta.title",
      "cta.description",
      "cta.action"
    ];

    for (const locale of ["en", "tr", "ar", "fa"] as const) {
      for (const path of requiredPaths) {
        const message = resolveMessage(locale, "events.overview", path);
        expect(message).not.toBe(`events.overview.${path}`);
        expect(message.trim()).not.toBe("");
      }
    }
  });
});
