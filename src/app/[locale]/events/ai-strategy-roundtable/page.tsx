import EventPage, { generateMetadata as generateEventMetadata } from "../[eventSlug]/page";
import type { Locale } from "@/i18n/routing";

const eventSlug = "ai-strategy-roundtable";

export function generateMetadata({ params }: { params: { locale: Locale } }) {
  return generateEventMetadata({ params: { ...params, eventSlug } });
}

export default function AiStrategyRoundtablePage({ params }: { params: { locale: Locale } }) {
  return EventPage({ params: { ...params, eventSlug } });
}
