import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetailPage } from "@/components/pages/EventDetailPage";
import type { Locale } from "@/i18n/routing";
import { getPublishedEventBySlug } from "@/lib/directus/events";

interface EventPageProps { params: { eventSlug: string; locale: Locale } }

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const result = await getPublishedEventBySlug(params.eventSlug);
  if (!result.ok || !result.data) return {};
  return {
    title: `${result.data.title} | SynergyMazeAI`,
    description: result.data.short_description || result.data.description || undefined
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const result = await getPublishedEventBySlug(params.eventSlug);
  if (!result.ok || !result.data) notFound();
  return <EventDetailPage event={result.data} locale={params.locale} />;
}
