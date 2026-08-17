import { beforeEach, describe, expect, it, vi } from "vitest";

const { request, getUser, getSession } = vi.hoisted(() => ({
  request: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn()
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));
vi.mock("@directus/sdk", () => ({
  createItem: (collection: string, item: unknown) => ({ operation: "create", collection, item }),
  readItems: (collection: string, query: unknown) => ({ operation: "read", collection, query }),
  withToken: (token: string, command: Record<string, unknown>) => ({ ...command, token }),
  isDirectusError: (error: unknown) => Boolean(error && typeof error === "object" && "errors" in error)
}));
vi.mock("@/lib/directus/client", () => ({
  createDirectusRestClient: () => ({ request })
}));
vi.mock("@/lib/directus/auth", () => ({
  getCurrentDirectusUser: getUser,
  getAuthenticatedDirectusSession: getSession
}));

import {
  countActiveEventRegistrations,
  createCurrentUserEventRegistration,
  getCurrentUserEventRegistrations,
  getPublishedEventBySlug,
  getPublishedEvents
} from "@/lib/directus/events";

const event = {
  id: 7,
  slug: "ai-workshop-2026",
  title: "AI Workshop 2026",
  short_description: "A Directus test event.",
  description: "Full event description.",
  event_date: "2026-09-10T10:00:00Z",
  end_date: "2026-09-10T14:00:00Z",
  location: "Istanbul",
  format: "In person",
  image_url: null,
  registration_open: true,
  capacity: 50,
  status: "published"
};

describe("Directus events", () => {
  beforeEach(() => {
    request.mockReset();
    getUser.mockReset().mockResolvedValue({ id: "current-user" });
    getSession.mockReset().mockResolvedValue({ accessToken: "user-token" });
    process.env.DIRECTUS_EVENT_SERVICE_TOKEN = "event-service-token";
  });

  it("lists published events and includes the Directus test event", async () => {
    request.mockResolvedValueOnce([event]);

    await expect(getPublishedEvents()).resolves.toEqual({ ok: true, data: [event] });
    expect(request.mock.calls[0][0].query.fields).toEqual([
      "id",
      "slug",
      "title",
      "short_description",
      "description",
      "event_date",
      "end_date",
      "location",
      "format",
      "image_url",
      "registration_open",
      "capacity",
      "status"
    ]);
    expect(request.mock.calls[0][0].query.filter).toEqual({ status: { _eq: "published" } });
    expect(request.mock.calls[0][0].query.sort).toEqual(["event_date"]);
  });

  it("excludes unpublished records through the Directus query", async () => {
    request.mockResolvedValueOnce([]);
    await expect(getPublishedEvents()).resolves.toEqual({ ok: true, data: [] });
    expect(request.mock.calls[0][0].query.filter.status._eq).toBe("published");
  });

  it("fetches an event detail by slug and published status", async () => {
    request.mockResolvedValueOnce([event]);
    await expect(getPublishedEventBySlug(event.slug)).resolves.toEqual({ ok: true, data: event });
    expect(request.mock.calls[0][0].query.filter).toEqual({
      slug: { _eq: event.slug },
      status: { _eq: "published" }
    });
    expect(request.mock.calls[0][0].query.fields).not.toContain("date_created");
    expect(request.mock.calls[0][0].query.fields).not.toContain("date_updated");
  });

  it("counts only registered or attended registrations for the requested event", async () => {
    request.mockResolvedValueOnce([{ id: "one" }, { id: "two" }]);
    await expect(countActiveEventRegistrations(event.id)).resolves.toEqual({ ok: true, data: 2 });
    expect(request.mock.calls[0][0]).toMatchObject({
      collection: "event_registrations",
      token: "event-service-token",
      query: {
        filter: { event: { _eq: 7 }, status: { _in: ["registered", "attended"] } }
      }
    });
  });

  it("creates an authenticated registration without sending user or status", async () => {
    request.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce({ id: "registration" });
    await expect(createCurrentUserEventRegistration({
      event,
      phoneCountryCode: "+90",
      phoneNumber: "5551234567",
      message: "Hello"
    })).resolves.toEqual({ ok: true });
    const create = request.mock.calls.map(([command]) => command).find((command) => command.operation === "create");
    expect(create.item).toEqual({ event: 7, phone_country_code: "+90", phone_number: "5551234567", message: "Hello" });
    expect(create.item).not.toHaveProperty("user");
    expect(create.item).not.toHaveProperty("status");
    expect(request.mock.calls.filter(([command]) => command.token === "event-service-token")).toHaveLength(2);
  });

  it("prevents an active duplicate using the ownership-scoped Website User session", async () => {
    request.mockResolvedValueOnce([{ id: "existing" }]);
    await expect(createCurrentUserEventRegistration({ event, phoneCountryCode: "+90", phoneNumber: "5551234567", message: null }))
      .resolves.toEqual({ ok: false, error: "alreadyRegistered" });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0].token).toBe("user-token");
  });

  it("treats null capacity as unlimited and does not use the service token", async () => {
    request.mockResolvedValueOnce([]).mockResolvedValueOnce({ id: "registration" });
    await expect(createCurrentUserEventRegistration({ event: { ...event, capacity: null }, phoneCountryCode: "+90", phoneNumber: "5551234567", message: null }))
      .resolves.toEqual({ ok: true });
    expect(request.mock.calls.some(([command]) => command.token === "event-service-token")).toBe(false);
  });

  it("prevents registration when active registrations reach capacity", async () => {
    request.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "full" }]);
    await expect(createCurrentUserEventRegistration({ event: { ...event, capacity: 1 }, phoneCountryCode: "+90", phoneNumber: "5551234567", message: null }))
      .resolves.toEqual({ ok: false, error: "eventFull" });
    expect(request.mock.calls.some(([command]) => command.operation === "create")).toBe(false);
  });

  it("reads current-user registrations through policy scope without filtering on hidden user", async () => {
    const registration = { id: "registration", date_created: null, date_updated: null, status: "registered", event };
    request.mockResolvedValueOnce([registration]);
    await expect(getCurrentUserEventRegistrations()).resolves.toEqual({ ok: true, data: [registration] });
    expect(request.mock.calls[0][0].token).toBe("user-token");
    expect(request.mock.calls[0][0].query).not.toHaveProperty("filter");
  });

  it("returns safe errors when Directus event reads fail", async () => {
    request.mockRejectedValueOnce(new Error("Directus unavailable"));
    await expect(getPublishedEvents()).resolves.toEqual({ ok: false, error: "requestFailed" });
  });
});
