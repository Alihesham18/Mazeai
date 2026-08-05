import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "contact",
  titleKey: "pages.contact.title",
  descriptionKey: "pages.contact.description",
  sections: ["Contact options", "Partnership inquiry", "Local mock handling"]
};

export const generateMetadata = createPageMetadata(page);

export default function ContactPage({ params }: { params: { locale: Locale } }) {
  return <StandalonePage locale={params.locale} page={page} />;
}
