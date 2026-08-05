import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "research/publications",
  titleKey: "navigation.publications",
  descriptionKey: "pages.placeholder.description",
  sections: ["Featured publications", "Filters", "Publication list", "Citation information"]
};

export const generateMetadata = createPageMetadata(page);

export default function PublicationsPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
