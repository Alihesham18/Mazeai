import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccountUser, getRegistrations } = vi.hoisted(() => ({
  requireAccountUser: vi.fn(),
  getRegistrations: vi.fn()
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async () => (key: string) => key)
}));
vi.mock("@/lib/auth/account", () => ({ requireAccountUser }));
vi.mock("@/lib/directus/events", () => ({
  getCurrentUserEventRegistrations: getRegistrations
}));

import EventRegistrationsPage from "@/app/[locale]/account/event-registrations/page";

describe("EventRegistrationsPage", () => {
  beforeEach(() => {
    requireAccountUser.mockReset();
    getRegistrations.mockReset();
    requireAccountUser.mockResolvedValue({ id: "current-user-uuid" });
  });

  it("keeps the empty state when the current user has no registrations", async () => {
    getRegistrations.mockResolvedValue({ ok: true, data: [] });

    render(await EventRegistrationsPage({ params: { locale: "en" } }));

    expect(requireAccountUser).toHaveBeenCalledWith("en", "/account/event-registrations");
    expect(screen.getByText("noEventRegistrations")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "browseEvents" })).toHaveAttribute(
      "href",
      "/en/events"
    );
  });

  it("renders the related event and localized detail route", async () => {
    getRegistrations.mockResolvedValue({
      ok: true,
      data: [
        {
          id: "registration-1",
          status: "registered",
          date_created: "2026-08-16T10:00:00Z",
          date_updated: null,
          event: {
            id: 7,
            slug: "future-of-ai",
            title: "Future of AI",
            event_date: "2026-09-20T15:00:00Z",
            location: "Istanbul",
            format: "Hybrid",
            status: "published"
          }
        }
      ]
    });

    render(await EventRegistrationsPage({ params: { locale: "tr" } }));

    expect(screen.getByRole("link", { name: "Future of AI" })).toHaveAttribute(
      "href",
      "/tr/events/future-of-ai"
    );
    expect(screen.getByText("eventRegistrationStatus.registered")).toBeInTheDocument();
    expect(screen.getByText(/Istanbul · Hybrid/)).toBeInTheDocument();
    expect(screen.queryByText("noEventRegistrations")).not.toBeInTheDocument();
  });

  it("shows a safe error when Directus cannot load registrations", async () => {
    getRegistrations.mockResolvedValue({ ok: false, error: "requestFailed" });

    render(await EventRegistrationsPage({ params: { locale: "en" } }));

    expect(screen.getByRole("alert")).toHaveTextContent("eventRegistrationsUnavailable");
  });
});
