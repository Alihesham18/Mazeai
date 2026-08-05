import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "services/research-development",
  titleKey: "navigation.researchDevelopment",
  descriptionKey: "pages.placeholder.description",
  sections: ["Overview", "Research services", "Methodology", "Deliverables", "CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function ResearchDevelopmentServicePage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
