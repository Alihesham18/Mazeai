import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "blog",
  titleKey: "pages.blog.title",
  descriptionKey: "pages.blog.description",
  sections: ["Latest posts", "Topics", "Newsletter placeholder"]
};

export const generateMetadata = createPageMetadata(page);

export default function BlogPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
