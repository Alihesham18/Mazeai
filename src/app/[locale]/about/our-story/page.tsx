import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "about/our-story",
  titleKey: "navigation.ourStory",
  descriptionKey: "pages.placeholder.description",
  sections: ["Origins", "Milestones", "Today", "Future"]
};

export const generateMetadata = createPageMetadata(page);

export default function OurStoryPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
