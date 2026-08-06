import { createPageMetadata, type StandalonePageConfig } from "@/components/pages/StandalonePage";
import { ServiceDetailPage } from "@/components/pages/ServiceDetailPage";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "services/web-design",
  titleKey: "services.webDesign.title",
  descriptionKey: "services.webDesign.intro",
  sections: []
};

export const generateMetadata = createPageMetadata(page);

export default function WebDesignPage({ params }: { params: { locale: Locale } }) {
  return (
    <ServiceDetailPage
      locale={params.locale}
      serviceKey="webDesign"
      image="/images/web-design-service.png"
      technologies={[
        "Figma",
        "Design systems",
        "Responsive UI",
        "Prototyping",
        "Accessibility",
        "User testing"
      ]}
    />
  );
}
