import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "services/academic-partnerships",
  titleKey: "navigation.academicPartnerships",
  descriptionKey: "pages.placeholder.description",
  sections: ["Overview", "Partnership models", "Research support", "Education support", "CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function AcademicPartnershipsPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
