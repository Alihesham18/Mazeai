import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "services/ai-solutions-automation",
  titleKey: "navigation.aiSolutions",
  descriptionKey: "pages.placeholder.description",
  sections: ["Overview", "Solutions", "Automation examples", "Process", "CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function AiSolutionsAutomationPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
