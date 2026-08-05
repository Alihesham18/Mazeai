import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "services/education-training",
  titleKey: "navigation.educationTraining",
  descriptionKey: "pages.placeholder.description",
  sections: ["Overview", "Programs", "Learning formats", "Outcomes", "CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function EducationTrainingPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
