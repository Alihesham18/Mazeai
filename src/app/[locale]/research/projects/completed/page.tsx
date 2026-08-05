import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "research/projects/completed",
  titleKey: "navigation.completedProjects",
  descriptionKey: "pages.placeholder.description",
  sections: ["Completed projects", "Results", "Publications", "Related work"]
};

export const generateMetadata = createPageMetadata(page);

export default function CompletedProjectsPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
