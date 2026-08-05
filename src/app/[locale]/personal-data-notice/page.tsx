import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "personal-data-notice",
  titleKey: "pages.personalData.title",
  descriptionKey: "pages.personalData.description",
  sections: ["KVKK placeholder", "Consent version", "Contact"],
  legal: true
};

export const generateMetadata = createPageMetadata(page);

export default function PersonalDataNoticePage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
