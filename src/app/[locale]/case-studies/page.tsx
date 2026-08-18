import {
  createPageMetadata,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import { CaseStudiesOverviewPage } from "@/components/pages/CaseStudiesOverviewPage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "case-studies",
  titleKey: "pages.caseStudies.title",
  descriptionKey: "pages.caseStudies.description",
  sections: ["Filters", "Sample results", "Related services", "CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function CaseStudiesPage({ params }: { params: { locale: Locale } }) {
  return <CaseStudiesOverviewPage locale={params.locale} />;
}
