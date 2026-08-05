import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "research",
  titleKey: "pages.research.title",
  descriptionKey: "pages.research.description",
  sections: ["Research areas", "Projects", "Publications", "Methodology", "Partnership CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default function ResearchPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
