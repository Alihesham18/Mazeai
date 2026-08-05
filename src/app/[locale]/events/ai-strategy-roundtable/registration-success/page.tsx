import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "events/ai-strategy-roundtable/registration-success",
  titleKey: "pages.placeholder.title",
  descriptionKey: "pages.placeholder.description",
  sections: ["Confirmation", "Event details", "Calendar action"]
};

export const generateMetadata = createPageMetadata(page);

export default function AiStrategyRoundtableSuccessPage({
  params
}: {
  params: { locale: Locale };
}) {
  return <StandalonePage locale={params.locale} page={page} />;
}
