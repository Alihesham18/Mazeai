import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "about/partners",
  titleKey: "pages.partners.title",
  descriptionKey: "pages.partners.description",
  sections: ["Partner categories", "Logo grid", "Models", "CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function PartnersPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
