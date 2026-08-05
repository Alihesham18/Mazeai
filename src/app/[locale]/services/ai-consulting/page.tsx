import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "services/ai-consulting",
  titleKey: "navigation.aiConsulting",
  descriptionKey: "pages.placeholder.description",
  sections: ["Overview", "Capabilities", "Process", "Deliverables", "CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function AiConsultingPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
