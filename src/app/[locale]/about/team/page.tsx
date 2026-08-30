import { createPageMetadata, type StandalonePageConfig } from "@/components/pages/StandalonePage";
import { TeamPage } from "@/components/pages/TeamPage";
import type { Locale } from "@/i18n/routing";
import { getPublishedTeamMembers } from "@/lib/directus/team";

const page: StandalonePageConfig = {
  path: "about/team",
  titleKey: "pages.team.title",
  descriptionKey: "pages.team.description",
  sections: ["Team"]
};

export const generateMetadata = createPageMetadata(page);

export default async function TeamRoute({ params }: { params: { locale: Locale } }) {
  const result = await getPublishedTeamMembers(params.locale);
  return <TeamPage locale={params.locale} result={result} />;
}
