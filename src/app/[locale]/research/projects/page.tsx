import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "research/projects",
  titleKey: "navigation.currentProjects",
  descriptionKey: "pages.placeholder.description",
  sections: ["Featured projects", "Current projects", "Project filters", "Partnership CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function ResearchProjectsPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
