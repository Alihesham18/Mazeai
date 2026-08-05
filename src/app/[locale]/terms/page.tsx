import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "terms",
  titleKey: "pages.terms.title",
  descriptionKey: "pages.terms.description",
  sections: ["Placeholder terms", "Service use"],
  legal: true
};

export const generateMetadata = createPageMetadata(page);

export default function TermsPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
