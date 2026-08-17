import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPublishedEvents } = vi.hoisted(() => ({ getPublishedEvents: vi.fn() }));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async () => (key: string) => key)
}));
vi.mock("@/lib/directus/events", () => ({ getPublishedEvents }));

import { EventsOverviewPage } from "@/components/pages/EventsOverviewPage";

const event = {
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
  status: "published"
};

describe("EventsOverviewPage", () => {
  beforeEach(() => getPublishedEvents.mockReset());

  it("renders published Directus event data and a localized detail route", async () => {
    getPublishedEvents.mockResolvedValue({ ok: true, data: [event] });

    render(await EventsOverviewPage({ locale: "tr" }));

    expect(screen.getByRole("heading", { name: "Future of AI" })).toBeInTheDocument();
    expect(screen.getByText("A published Directus event")).toBeInTheDocument();
    expect(screen.getByText("Istanbul")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/tr/events/future-of-ai");
  });

  it("renders the empty state", async () => {
    getPublishedEvents.mockResolvedValue({ ok: true, data: [] });

    render(await EventsOverviewPage({ locale: "en" }));

    expect(screen.getByText("noEvents")).toBeInTheDocument();
  });

  it("renders a safe error state", async () => {
    getPublishedEvents.mockResolvedValue({ ok: false, error: "requestFailed" });

    render(await EventsOverviewPage({ locale: "en" }));

    expect(screen.getByRole("alert")).toHaveTextContent("unableToLoadEvents");
  });
});
