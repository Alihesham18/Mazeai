import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "about/partners/sample-partner",
  titleKey: "pages.placeholder.title",
  descriptionKey: "pages.placeholder.description",
  sections: ["Partner overview", "Collaboration", "Results", "Related work"]
};

export const generateMetadata = createPageMetadata(page);

export default function PartnerProfilePage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
