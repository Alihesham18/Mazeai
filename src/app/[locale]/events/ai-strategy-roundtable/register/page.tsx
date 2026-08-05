import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "events/ai-strategy-roundtable/register",
  titleKey: "pages.placeholder.title",
  descriptionKey: "pages.placeholder.description",
  sections: ["Registration form", "Attendee details", "Consent", "Confirmation"]
};

export const generateMetadata = createPageMetadata(page);

export default function AiStrategyRoundtableRegisterPage({
  params
}: {
  params: { locale: Locale };
}) {
  return <StandalonePage locale={params.locale} page={page} />;
}
