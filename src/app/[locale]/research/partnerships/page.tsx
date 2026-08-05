import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "research/partnerships",
  titleKey: "navigation.researchPartnerships",
  descriptionKey: "pages.placeholder.description",
  sections: ["Partnership models", "Who we work with", "Process", "CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function ResearchPartnershipsPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
