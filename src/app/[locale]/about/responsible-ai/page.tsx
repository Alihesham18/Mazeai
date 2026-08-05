import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "about/responsible-ai",
  titleKey: "navigation.responsibleAi",
  descriptionKey: "pages.placeholder.description",
  sections: ["Principles", "Governance", "Risk management", "Resources"]
};

export const generateMetadata = createPageMetadata(page);

export default function ResponsibleAiPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
