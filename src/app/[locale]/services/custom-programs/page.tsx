import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "services/custom-programs",
  titleKey: "navigation.customPrograms",
  descriptionKey: "pages.placeholder.description",
  sections: ["Overview", "Program design", "Delivery options", "Process", "CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function CustomProgramsPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
