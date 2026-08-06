import { createPageMetadata, type StandalonePageConfig } from "@/components/pages/StandalonePage";
import { EventsOverviewPage } from "@/components/pages/EventsOverviewPage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "events",
  titleKey: "pages.events.title",
  descriptionKey: "pages.events.description",
  sections: ["Featured event", "Filters", "Upcoming events", "Past events", "Host CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function EventsPage({ params }: { params: { locale: Locale } }) {
  return <EventsOverviewPage locale={params.locale} />;
}
