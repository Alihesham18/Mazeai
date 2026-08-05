import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "research/innovation-lab",
  titleKey: "navigation.innovationLab",
  descriptionKey: "pages.placeholder.description",
  sections: ["Lab overview", "Focus areas", "Prototypes", "Work with the lab"]
};

export const generateMetadata = createPageMetadata(page);

export default function InnovationLabPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
