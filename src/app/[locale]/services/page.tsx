import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "services",
  titleKey: "pages.services.title",
  descriptionKey: "pages.services.description",
  sections: ["Hero", "Service cards", "Process", "FAQ", "CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function ServicesPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
