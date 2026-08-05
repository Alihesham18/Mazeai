import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "about/mission-vision",
  titleKey: "navigation.missionVision",
  descriptionKey: "pages.placeholder.description",
  sections: ["Mission", "Vision", "Values", "CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function MissionVisionPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
