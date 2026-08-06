import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetailPage } from "@/components/pages/EventDetailPage";
import { featuredEvents, getFeaturedEvent } from "@/data/featured-events";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/utilities/localize";

interface EventPageProps {
  params: { eventSlug: string; locale: Locale };
}

export function generateStaticParams() {
  return featuredEvents.map((event) => ({ eventSlug: event.slug }));
}

export function generateMetadata({ params }: EventPageProps): Metadata {
  const event = getFeaturedEvent(params.eventSlug);

  if (!event) return {};

  return {
    title: `${event.title} | SynergyMazeAI`,
    description: localize(event.description, params.locale)
  };
}

export default function EventPage({ params }: EventPageProps) {
  const event = getFeaturedEvent(params.eventSlug);

  if (!event) notFound();

  return <EventDetailPage event={event} locale={params.locale} />;
}
