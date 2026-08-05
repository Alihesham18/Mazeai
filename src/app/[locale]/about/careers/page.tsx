import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "about/careers",
  titleKey: "navigation.careers",
  descriptionKey: "pages.placeholder.description",
  sections: ["Culture", "Open roles", "Application process", "Contact"]
};

export const generateMetadata = createPageMetadata(page);

export default function CareersPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
