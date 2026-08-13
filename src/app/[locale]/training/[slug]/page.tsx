import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrainingCoursePage } from "@/components/pages/TrainingCoursePage";
import { getTrainingProgram, trainingPrograms } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/utilities/localize";
import { getCurrentUserProfile, withDirectusProfilePhone } from "@/lib/auth/user";
import { getCurrentUserDirectusProfile } from "@/lib/directus/profile";
import { getPublishedTrainingProgramBySlug } from "@/lib/directus/training";
import { mergeDirectusTrainingProgram } from "@/lib/training/directus";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return trainingPrograms.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({
  params
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const localProgram = getTrainingProgram(params.slug);

  if (!localProgram) return {};
  const directusProgram = await getPublishedTrainingProgramBySlug(params.slug);
  const program =
    directusProgram.ok && directusProgram.data
      ? mergeDirectusTrainingProgram(localProgram, directusProgram.data)
      : localProgram;

  return {
    title: `${localize(program.title, params.locale)} | SynergyMazeAI`,
    description: localize(program.shortDescription, params.locale)
  };
}

export default async function TrainingProgramPage({
  params
}: {
  params: { locale: Locale; slug: string };
}) {
  const localProgram = getTrainingProgram(params.slug);

  if (!localProgram) notFound();

  const [directusProgram, currentUser] = await Promise.all([
    getPublishedTrainingProgramBySlug(params.slug),
    getCurrentUserProfile()
  ]);
  if (directusProgram.ok && !directusProgram.data) notFound();

  const program =
    directusProgram.ok && directusProgram.data
      ? mergeDirectusTrainingProgram(localProgram, directusProgram.data)
      : { ...localProgram, applicationOpen: !currentUser, directusAvailable: false };
  const directusProfile = currentUser ? await getCurrentUserDirectusProfile() : null;
  const user = currentUser
    ? withDirectusProfilePhone(
        currentUser,
        directusProfile?.ok ? directusProfile.profile : null
      )
    : null;
  return <TrainingCoursePage locale={params.locale} program={program} user={user} />;
}
