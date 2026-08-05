import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "blog/responsible-ai-starting-points",
  titleKey: "pages.placeholder.title",
  descriptionKey: "pages.placeholder.description",
  sections: ["Article header", "Article body", "Author", "Related posts"]
};

export const generateMetadata = createPageMetadata(page);

export default function ResponsibleAiStartingPointsPage({
  params
}: {
  params: { locale: Locale };
}) {
  return <StandalonePage locale={params.locale} page={page} />;
}
