import { beforeEach, describe, expect, it, vi } from "vitest";

const { createRegistration, getEvent, revalidatePath } = vi.hoisted(() => ({
  createRegistration: vi.fn(),
  getEvent: vi.fn(),
  revalidatePath: vi.fn()
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/directus/events", () => ({
  createCurrentUserEventRegistration: createRegistration,
  getPublishedEventBySlug: getEvent
}));

import { submitEventRegistrationAction } from "@/lib/events/actions";

const initialState = { status: "idle" } as const;

function form(phone = "+90 552 507 38 89", message = "Please reserve my seat") {
  const data = new FormData();
  data.set("phone", phone);
  data.set("message", message);
  return data;
}

describe("event registration action", () => {
  beforeEach(() => {
    createRegistration.mockReset();
    getEvent.mockReset();
    revalidatePath.mockReset();
  });

  it("exports only async server actions at runtime", async () => {
    const actions = await import("@/lib/events/actions");

    expect(Object.keys(actions)).toEqual(["submitEventRegistrationAction"]);
    expect(actions.submitEventRegistrationAction.constructor.name).toBe("AsyncFunction");
  });

  it("rejects invalid phone input before reading Directus", async () => {
    await expect(
      submitEventRegistrationAction("en", "future-of-ai", initialState, form("bad"))
    ).resolves.toEqual({ status: "error", message: "invalidPhone" });
    expect(getEvent).not.toHaveBeenCalled();
  });

  it("rejects a closed event before registration creation", async () => {
    getEvent.mockResolvedValueOnce({
      ok: true,
      data: { id: 4, slug: "future-of-ai", registration_open: false }
    });

    await expect(
      submitEventRegistrationAction("en", "future-of-ai", initialState, form())
    ).resolves.toEqual({ status: "error", message: "registrationClosed" });
    expect(createRegistration).not.toHaveBeenCalled();
  });

  it("resolves the published event and submits normalized phone fields", async () => {
    const event = { id: 4, slug: "future-of-ai", registration_open: true };
    getEvent.mockResolvedValueOnce({ ok: true, data: event });
    createRegistration.mockResolvedValueOnce({ ok: true });

    await expect(
      submitEventRegistrationAction("tr", "future-of-ai", initialState, form())
    ).resolves.toEqual({ status: "success", message: "registrationSuccessful" });
    expect(createRegistration).toHaveBeenCalledWith({
      event,
      phoneCountryCode: "+90",
      phoneNumber: "5525073889",
      message: "Please reserve my seat"
    });
    expect(revalidatePath).toHaveBeenCalledWith("/tr/events/future-of-ai");
    expect(revalidatePath).toHaveBeenCalledWith("/tr/account/event-registrations");
  });

  it("returns the safe registration error from the server helper", async () => {
    getEvent.mockResolvedValueOnce({
      ok: true,
      data: { id: 4, slug: "future-of-ai", registration_open: true }
    });
    createRegistration.mockResolvedValueOnce({ ok: false, error: "eventFull" });

    await expect(
      submitEventRegistrationAction("en", "future-of-ai", initialState, form())
    ).resolves.toEqual({ status: "error", message: "eventFull" });
  });
});
