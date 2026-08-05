import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "research/projects/responsible-ai-checklist",
  titleKey: "pages.placeholder.title",
  descriptionKey: "pages.placeholder.description",
  sections: ["Project overview", "Framework", "Method", "Expected outcomes"]
};

export const generateMetadata = createPageMetadata(page);

export default function ResponsibleAiChecklistPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
