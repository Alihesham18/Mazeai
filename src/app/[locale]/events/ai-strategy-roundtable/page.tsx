import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "events/ai-strategy-roundtable",
  titleKey: "pages.placeholder.title",
  descriptionKey: "pages.placeholder.description",
  sections: ["Event overview", "Agenda", "Speakers", "Registration"]
};

export const generateMetadata = createPageMetadata(page);

export default function AiStrategyRoundtablePage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
