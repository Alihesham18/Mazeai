import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import fa from "../../messages/fa.json";
import tr from "../../messages/tr.json";
import type { DirectusEvent } from "@/lib/directus/types";

type SupportedLocale = "en" | "tr" | "ar" | "fa";

const catalogs = { en, tr, ar, fa } as const;
const { getCurrentUserProfile, getPublishedEvents } = vi.hoisted(() => ({
  getCurrentUserProfile: vi.fn(),
  getPublishedEvents: vi.fn()
}));

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
vi.mock("react-dom", () => ({
  useFormState: vi.fn(() => [{ status: "idle" }, vi.fn()]),
  useFormStatus: vi.fn(() => ({ pending: false }))
}));
vi.mock("@/lib/events/actions", () => ({ submitEventRegistrationAction: vi.fn() }));
vi.mock("@/lib/auth/user", () => ({ getCurrentUserProfile }));
vi.mock("@/lib/directus/events", () => ({ getPublishedEvents }));

import { EventDetailPage } from "@/components/pages/EventDetailPage";

function event(overrides: Partial<DirectusEvent> = {}): DirectusEvent {
  return {
    id: 7,
    slug: "ai-workshop-2026",
    title: "AI Workshop 2026",
    short_description: "Practical AI workshop covering modern AI tools and applications.",
    description: "A real Directus event description.",
    event_date: "2026-08-30T14:00:00Z",
    end_date: "2026-08-30T17:00:00Z",
    location: "Istanbul + Online",
    format: "Hybrid",
    image_url: null,
    registration_open: false,
    capacity: 1,
    status: "published",
    ...overrides
  };
}

describe("Event detail page", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-25T10:00:00Z"));
    getCurrentUserProfile.mockReset().mockResolvedValue(null);
    getPublishedEvents.mockReset().mockResolvedValue({ ok: true, data: [event()] });
  });

  afterEach(() => vi.useRealTimers());

  it("renders the real event briefing, date, metadata, about content, and closed state", async () => {
    render(await EventDetailPage({ event: event(), locale: "en" }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("AI Workshop 2026");
    expect(screen.getByText("Practical AI workshop covering modern AI tools and applications.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.events.detail.about.title })).toBeInTheDocument();
    expect(screen.getByText("A real Directus event description.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Program schedule visual for AI Workshop 2026" })).toBeInTheDocument();

    const expectedDate = new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(
      new Date(event().event_date)
    );
    const expectedStart = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(
      new Date(event().event_date)
    );
    const expectedEnd = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(
      new Date(event().end_date as string)
    );
    expect(screen.getAllByText(expectedDate)).not.toHaveLength(0);
    expect(screen.getAllByText(expectedStart)).not.toHaveLength(0);
    expect(screen.getAllByText(expectedEnd)).not.toHaveLength(0);

    const locationMeta = screen.getByText(en.events.detail.meta.location).closest("div");
    const formatMeta = screen.getByText(en.events.detail.meta.format).closest("div");
    const capacityMeta = screen.getByText(en.events.detail.meta.capacity).closest("div");
    expect(locationMeta && within(locationMeta).getByText("Istanbul + Online")).toBeInTheDocument();
    expect(formatMeta && within(formatMeta).getByText("Hybrid")).toBeInTheDocument();
    expect(capacityMeta && within(capacityMeta).getByText("1")).toBeInTheDocument();
    expect(screen.getAllByText(en.events.detail.registration.closed).length).toBeGreaterThan(0);
    expect(screen.getByText(en.events.registrationClosed).closest('[role="status"]')).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: en.events.register })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /event program/i })).not.toBeInTheDocument();
  });

  it("preserves the real registration form and login flow for an open upcoming event", async () => {
    const openEvent = event({ registration_open: true });
    getPublishedEvents.mockResolvedValue({ ok: true, data: [openEvent] });

    render(await EventDetailPage({ event: openEvent, locale: "en" }));

    expect(screen.getAllByText(en.events.detail.registration.open).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: en.events.register })).toHaveAttribute(
      "href",
      "/en/login?next=%2Fen%2Fevents%2Fai-workshop-2026%23registration"
    );
  });

  it("never exposes an active registration action for a completed event", async () => {
    const completedEvent = event({
      event_date: "2026-01-10T14:00:00Z",
      end_date: "2026-01-10T17:00:00Z",
      registration_open: true
    });
    getPublishedEvents.mockResolvedValue({ ok: true, data: [completedEvent] });

    render(await EventDetailPage({ event: completedEvent, locale: "en" }));

    expect(screen.getByText(en.events.detail.status.completed)).toBeInTheDocument();
    expect(screen.getAllByText(en.events.detail.registration.closed).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: en.events.register })).not.toBeInTheDocument();
  });

  it("shows up to three real other events and excludes the current event", async () => {
    const related = [
      event({ id: 8, slug: "event-two", title: "Event Two", event_date: "2026-09-02T10:00:00Z" }),
      event({ id: 9, slug: "event-three", title: "Event Three", event_date: "2026-10-02T10:00:00Z" }),
      event({ id: 10, slug: "event-four", title: "Event Four", event_date: "2026-11-02T10:00:00Z" }),
      event({ id: 11, slug: "event-five", title: "Event Five", event_date: "2026-12-02T10:00:00Z" })
    ];
    getPublishedEvents.mockResolvedValue({ ok: true, data: [event(), ...related] });

    render(await EventDetailPage({ event: event(), locale: "en" }));

    expect(screen.getByRole("heading", { name: en.events.detail.other.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Event Two" })).toHaveAttribute("href", "/en/events/event-two");
    expect(screen.getByRole("link", { name: "View Event Three" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Event Four" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View Event Five" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "AI Workshop 2026" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "View AI Workshop 2026" })).not.toBeInTheDocument();
  });

  it("omits the Other Events section when no other record exists or the listing read fails", async () => {
    getPublishedEvents.mockResolvedValue({ ok: false, error: "requestFailed" });

    render(await EventDetailPage({ event: event(), locale: "en" }));

    expect(screen.queryByRole("heading", { name: en.events.detail.other.title })).not.toBeInTheDocument();
  });

  it("localizes Arabic content and navigation inside the inherited RTL layout", async () => {
    const view = render(<div dir="rtl">{await EventDetailPage({ event: event(), locale: "ar" })}</div>);

    expect(view.container.firstElementChild).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("link", { name: ar.events.detail.back })).toHaveAttribute("href", "/ar/events");
    expect(screen.getByRole("heading", { name: ar.events.detail.about.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: ar.events.detail.viewAll })).toHaveAttribute("href", "/ar/events");
  });

  it("provides complete detail-page copy in every supported locale", () => {
    const requiredPaths = [
      "back",
      "header.overline",
      "status.upcoming",
      "status.completed",
      "visualAriaLabel",
      "meta.time",
      "meta.location",
      "meta.format",
      "meta.capacity",
      "meta.registration",
      "about.title",
      "registration.title",
      "registration.open",
      "registration.closed",
      "other.title",
      "other.viewNamed",
      "closingNavigation",
      "viewAll"
    ];

    for (const locale of ["en", "tr", "ar", "fa"] as const) {
      for (const path of requiredPaths) {
        const message = resolveMessage(locale, "events.detail", path);
        expect(message).not.toBe(`events.detail.${path}`);
        expect(message.trim()).not.toBe("");
      }
    }
  });
});
