import {
  createPageMetadata,
  StandalonePage,
  type StandalonePageConfig
} from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "events/research-prototype-clinic/register",
  titleKey: "pages.placeholder.title",
  descriptionKey: "pages.placeholder.description",
  sections: ["Registration form", "Attendee details", "Consent", "Confirmation"]
};

export const generateMetadata = createPageMetadata(page);

export default function ResearchPrototypeClinicRegisterPage({
  params
}: {
  params: { locale: Locale };
}) {
  return <StandalonePage locale={params.locale} page={page} />;
}
