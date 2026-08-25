import type { DirectusEvent } from "@/lib/directus/types";

export type EventTimingStatus = "upcoming" | "completed";

export function eventTimestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getEventTimingStatus(
  event: Pick<DirectusEvent, "event_date">,
  now = Date.now()
): EventTimingStatus | null {
  const startsAt = eventTimestamp(event.event_date);
  if (startsAt === null) return null;
  return startsAt >= now ? "upcoming" : "completed";
}

export function partitionEvents(events: DirectusEvent[], now = Date.now()) {
  const upcoming = events
    .filter((event) => getEventTimingStatus(event, now) === "upcoming")
    .sort((a, b) => (eventTimestamp(a.event_date) ?? 0) - (eventTimestamp(b.event_date) ?? 0));
  const completed = events
    .filter((event) => getEventTimingStatus(event, now) === "completed")
    .sort((a, b) => (eventTimestamp(b.event_date) ?? 0) - (eventTimestamp(a.event_date) ?? 0));

  return { upcoming, completed };
}

export function otherEvents(
  events: DirectusEvent[],
  currentEvent: Pick<DirectusEvent, "id" | "slug">,
  now = Date.now(),
  limit = 3
) {
  const candidates = events.filter(
    (event) => event.id !== currentEvent.id && event.slug !== currentEvent.slug
  );
  const { upcoming, completed } = partitionEvents(candidates, now);
  return [...upcoming, ...completed].slice(0, limit);
}
