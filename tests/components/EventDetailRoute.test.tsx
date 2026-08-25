import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getBySlug, notFound } = vi.hoisted(() => ({
  getBySlug: vi.fn(),
  notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); })
}));

vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/lib/directus/events", () => ({ getPublishedEventBySlug: getBySlug }));
vi.mock("@/components/pages/EventDetailPage", () => ({
  EventDetailPage: ({ event }: { event: { title: string } }) => <p>{event.title}</p>
}));

import EventPage, { generateMetadata } from "@/app/[locale]/events/[eventSlug]/page";

const event = {
  title: "AI Workshop 2026",
  short_description: "A real Directus event description.",
  description: "Long description."
};

describe("Event detail route", () => {
  beforeEach(() => {
    getBySlug.mockReset();
    notFound.mockClear();
  });

  it("renders a valid published event slug", async () => {
    getBySlug.mockResolvedValue({ ok: true, data: event });

    render(await EventPage({ params: { locale: "tr", eventSlug: "ai-workshop-2026" } }));

    expect(getBySlug).toHaveBeenCalledWith("ai-workshop-2026");
    expect(screen.getByText("AI Workshop 2026")).toBeInTheDocument();
  });

  it("preserves notFound behavior for invalid slugs and safe read failures", async () => {
    getBySlug.mockResolvedValue({ ok: true, data: null });
    await expect(
      EventPage({ params: { locale: "en", eventSlug: "missing" } })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    getBySlug.mockResolvedValue({ ok: false, error: "requestFailed" });
    await expect(
      EventPage({ params: { locale: "en", eventSlug: "unavailable" } })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(2);
  });

  it("preserves title and description metadata without inventing fields", async () => {
    getBySlug.mockResolvedValue({ ok: true, data: event });

    await expect(generateMetadata({
      params: { locale: "en", eventSlug: "ai-workshop-2026" }
    })).resolves.toEqual({
      title: "AI Workshop 2026 | SynergyMazeAI",
      description: "A real Directus event description."
    });

    getBySlug.mockResolvedValue({ ok: true, data: null });
    await expect(generateMetadata({
      params: { locale: "en", eventSlug: "missing" }
    })).resolves.toEqual({});
  });
});
