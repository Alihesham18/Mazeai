import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "case-studies",
  titleKey: "pages.caseStudies.title",
  descriptionKey: "pages.caseStudies.description",
  sections: ["Filters", "Sample results", "Related services", "CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function CaseStudiesPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
