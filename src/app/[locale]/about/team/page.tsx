import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "about/team",
  titleKey: "pages.team.title",
  descriptionKey: "pages.team.description",
  sections: ["Role filters", "Placeholder profiles", "Expertise"]
};

export const generateMetadata = createPageMetadata(page);

export default function TeamPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
