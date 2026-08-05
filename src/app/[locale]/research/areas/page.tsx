import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "research/areas",
  titleKey: "navigation.researchAreas",
  descriptionKey: "pages.placeholder.description",
  sections: ["Overview", "AI research", "Education research", "Applied innovation", "CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function ResearchAreasPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
