import { createPageMetadata, type StandalonePageConfig } from "@/components/pages/StandalonePage";
import { ServiceDetailPage } from "@/components/pages/ServiceDetailPage";
import { webDevelopmentProjects } from "@/data/web-development-projects";
import type { Locale } from "@/i18n/routing";

const page: StandalonePageConfig = {
  path: "services/web-development",
  titleKey: "services.webDevelopment.title",
  descriptionKey: "services.webDevelopment.intro",
  sections: []
};

export const generateMetadata = createPageMetadata(page);

export default function WebDevelopmentPage({ params }: { params: { locale: Locale } }) {
  return (
    <ServiceDetailPage
      locale={params.locale}
      serviceKey="webDevelopment"
      image="/images/web-development-service.png"
      technologies={["Next.js", "React", "TypeScript", "Node.js", "APIs", "Cloud platforms"]}
      projects={webDevelopmentProjects}
    />
  );
}
