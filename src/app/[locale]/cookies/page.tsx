import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "cookies",
  titleKey: "pages.cookies.title",
  descriptionKey: "pages.cookies.description",
  sections: ["Placeholder policy", "Preference model"],
  legal: true
};

export const generateMetadata = createPageMetadata(page);

export default function CookiesPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
