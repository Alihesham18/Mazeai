import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "privacy",
  titleKey: "pages.privacy.title",
  descriptionKey: "pages.privacy.description",
  sections: ["Placeholder notice", "Data minimization", "Deletion workflow"],
  legal: true
};

export const generateMetadata = createPageMetadata(page);

export default function PrivacyPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
