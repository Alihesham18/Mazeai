import { ResearchPartnershipsPage as ResearchPartnershipsExperience } from "@/components/pages/ResearchPartnershipsPage/ResearchPartnershipsPage";
import { createPageMetadata, type StandalonePageConfig } from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "research/partnerships",
  titleKey: "research.partnerships.title",
  descriptionKey: "research.partnerships.description",
  sections: ["Collaboration audiences", "Collaboration models", "Partnership scope", "Process", "Ecosystem", "CTA"]
};

export const generateMetadata = createPageMetadata(page);

export default async function ResearchPartnershipsPage({ params }: { params: { locale: Locale } }) {
  return ResearchPartnershipsExperience({ locale: params.locale });
}
