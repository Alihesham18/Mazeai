import { ResearchAreasPage as ResearchAreasExperience } from "@/components/pages/ResearchAreasPage/ResearchAreasPage";
import { createPageMetadata, type StandalonePageConfig } from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "research/areas",
  titleKey: "research.areas.title",
  descriptionKey: "research.areas.description",
  sections: [
    "Research metrics",
    "Research domains",
    "Research methodology",
    "Technology stack",
    "Global impact"
  ]
};

export const generateMetadata = createPageMetadata(page);

export default async function ResearchAreasPage({ params }: { params: { locale: Locale } }) {
  return ResearchAreasExperience({ locale: params.locale });
}
