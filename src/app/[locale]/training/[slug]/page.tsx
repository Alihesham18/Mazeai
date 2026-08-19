import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TrainingCoursePage } from "@/components/pages/TrainingCoursePage";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/routing";
import { getCurrentUserProfile, withDirectusProfilePhone } from "@/lib/auth/user";
import { getCurrentUserDirectusProfile } from "@/lib/directus/profile";
import { getLocalizedPublishedTrainingProgramBySlug } from "@/lib/directus/training";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const result = await getLocalizedPublishedTrainingProgramBySlug(params.slug, params.locale);
  if (!result.ok || !result.data) return {};
  const program = result.data;

  return {
    title: `${program.title} | SynergyMazeAI`,
    description: program.shortDescription ?? undefined
  };
}

export default async function TrainingProgramPage({
  params
}: {
  params: { locale: Locale; slug: string };
}) {
  const [directusProgram, currentUser] = await Promise.all([
    getLocalizedPublishedTrainingProgramBySlug(params.slug, params.locale),
    getCurrentUserProfile()
  ]);
  if (!directusProgram.ok) {
    const t = await getTranslations({ locale: params.locale, namespace: "training" });
    return (
      <main className={styles.state}>
        <Container>
          <p role="alert">{t("unavailable")}</p>
        </Container>
      </main>
    );
  }
  if (!directusProgram.data) notFound();

  const directusProfile = currentUser ? await getCurrentUserDirectusProfile() : null;
  const user = currentUser
    ? withDirectusProfilePhone(
        currentUser,
        directusProfile?.ok ? directusProfile.profile : null
      )
    : null;
  return <TrainingCoursePage locale={params.locale} program={directusProgram.data} user={user} />;
}
