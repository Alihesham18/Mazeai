import "server-only";

import { createItem, readItems, withToken } from "@directus/sdk";
import { unstable_noStore as noStore } from "next/cache";
import { getAuthenticatedDirectusSession, getCurrentDirectusUser } from "./auth";
import { createDirectusRestClient } from "./client";
import { logDirectusDiagnostic } from "./diagnostics";
import type {
  DirectusEvent,
  EventRegistrationStatus
} from "./types";

type EventReadResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: "configuration" | "requestFailed" | "sessionExpired" };

export type EventRegistrationError =
  | "alreadyRegistered"
  | "eventFull"
  | "registrationClosed"
  | "sessionExpired"
  | "registrationFailed";

export interface AccountEventRegistration {
  id: string;
  date_created: string | null;
  date_updated: string | null;
  status: EventRegistrationStatus;
  event: number | Pick<
    DirectusEvent,
    "id" | "slug" | "title" | "event_date" | "location" | "format" | "status"
  >;
}

const eventFields = [
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
] as const;

const accountRegistrationFields = [
  "id",
  "date_created",
  "date_updated",
  "status",
  { event: ["id", "slug", "title", "event_date", "location", "format", "status"] }
] as const;

const activeStatuses: EventRegistrationStatus[] = ["registered", "attended"];
const registrationLocks = new Map<string, Promise<void>>();

function eventServiceToken() {
  return process.env.DIRECTUS_EVENT_SERVICE_TOKEN?.trim() || null;
}

export async function getPublishedEvents(): Promise<EventReadResult<DirectusEvent[]>> {
  noStore();
  const client = createDirectusRestClient();
  if (!client) return { ok: false, error: "configuration" };

  try {
    const events = await client.request(
      readItems("event", {
        fields: eventFields,
        filter: { status: { _eq: "published" } },
        sort: ["event_date"]
      })
    );
    return { ok: true, data: events };
  } catch (caught) {
    logDirectusDiagnostic("events.read-published", caught);
    return { ok: false, error: "requestFailed" };
  }
}

export async function getPublishedEventBySlug(
  slug: string
): Promise<EventReadResult<DirectusEvent | null>> {
  noStore();
  const client = createDirectusRestClient();
  if (!client) return { ok: false, error: "configuration" };

  try {
    const events = await client.request(
      readItems("event", {
        fields: eventFields,
        filter: { slug: { _eq: slug }, status: { _eq: "published" } },
        limit: 1
      })
    );
    return { ok: true, data: events[0] ?? null };
  } catch (caught) {
    logDirectusDiagnostic("events.read-published-by-slug", caught);
    return { ok: false, error: "requestFailed" };
  }
}

export async function countActiveEventRegistrations(
  eventId: number
): Promise<EventReadResult<number>> {
  noStore();
  const client = createDirectusRestClient();
  const token = eventServiceToken();
  if (!client || !token) return { ok: false, error: "configuration" };

  try {
    const registrations = await client.request(
      withToken(
        token,
        readItems("event_registrations", {
          fields: ["id"],
          filter: {
            event: { _eq: eventId },
            status: { _in: activeStatuses }
          },
          limit: -1
        })
      )
    );
    return { ok: true, data: registrations.length };
  } catch (caught) {
    logDirectusDiagnostic("event-registrations.count-active-capacity", caught);
    return { ok: false, error: "requestFailed" };
  }
}

async function createRegistrationLocked(input: {
  event: DirectusEvent;
  phoneCountryCode: string;
  phoneNumber: string;
  message: string | null;
}): Promise<{ ok: true } | { ok: false; error: EventRegistrationError }> {
  const client = createDirectusRestClient();
  const currentUser = await getCurrentDirectusUser();
  const session = currentUser ? await getAuthenticatedDirectusSession() : null;
  if (!client || !currentUser || !session) return { ok: false, error: "sessionExpired" };
  if (!input.event.registration_open) return { ok: false, error: "registrationClosed" };

  try {
    const active = await client.request(
      withToken(
        session.accessToken,
        readItems("event_registrations", {
          fields: ["id"],
          filter: {
            event: { _eq: input.event.id },
            status: { _in: activeStatuses }
          },
          limit: 1
        })
      )
    );
    if (active.length > 0) return { ok: false, error: "alreadyRegistered" };

    if (input.event.capacity !== null) {
      const firstCount = await countActiveEventRegistrations(input.event.id);
      if (!firstCount.ok) return { ok: false, error: "registrationFailed" };
      if (firstCount.data >= input.event.capacity) return { ok: false, error: "eventFull" };

      // Re-check immediately before creation. This is intentionally structured so a
      // transactional Directus Flow can replace count-then-create if strict atomicity is needed.
      const finalCount = await countActiveEventRegistrations(input.event.id);
      if (!finalCount.ok) return { ok: false, error: "registrationFailed" };
      if (finalCount.data >= input.event.capacity) return { ok: false, error: "eventFull" };
    }

    await client.request(
      withToken(
        session.accessToken,
        createItem("event_registrations", {
          event: input.event.id,
          phone_country_code: input.phoneCountryCode,
          phone_number: input.phoneNumber,
          message: input.message
        })
      )
    );
    return { ok: true };
  } catch (caught) {
    logDirectusDiagnostic("event-registrations.create-current-user", caught);
    return { ok: false, error: "registrationFailed" };
  }
}

export async function createCurrentUserEventRegistration(input: {
  event: DirectusEvent;
  phoneCountryCode: string;
  phoneNumber: string;
  message: string | null;
}) {
  const currentUser = await getCurrentDirectusUser();
  if (!currentUser) return { ok: false, error: "sessionExpired" } as const;
  const key = `${currentUser.id}:${input.event.id}`;
  const previous = registrationLocks.get(key) ?? Promise.resolve();
  let release = () => {};
  const current = new Promise<void>((resolve) => (release = resolve));
  registrationLocks.set(key, current);
  await previous;
  try {
    return await createRegistrationLocked(input);
  } finally {
    release();
    if (registrationLocks.get(key) === current) registrationLocks.delete(key);
  }
}

export async function getCurrentUserEventRegistrations(): Promise<
  EventReadResult<AccountEventRegistration[]>
> {
  noStore();
  const client = createDirectusRestClient();
  const session = await getAuthenticatedDirectusSession();
  if (!client || !session) return { ok: false, error: "sessionExpired" };

  try {
    const registrations = await client.request(
      withToken(
        session.accessToken,
        readItems("event_registrations", {
          fields: accountRegistrationFields,
          sort: ["-date_created"]
        })
      )
    );
    return { ok: true, data: registrations };
  } catch (caught) {
    logDirectusDiagnostic("event-registrations.read-current-user", caught);
    return { ok: false, error: "requestFailed" };
  }
}
