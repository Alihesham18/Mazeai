import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrainingCoursePage } from "@/components/pages/TrainingCoursePage";
import { getTrainingProgram } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/utilities/localize";
import { getCurrentUserProfile, withDirectusProfilePhone } from "@/lib/auth/user";
import { getCurrentUserDirectusProfile } from "@/lib/directus/profile";
import { getPublishedTrainingProgramBySlug } from "@/lib/directus/training";
import { mergeDirectusTrainingProgram } from "@/lib/training/directus";

export const dynamic = "force-dynamic";

const program = getTrainingProgram("data-science-machine-learning");

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  if (!program) return {};
  const directusProgram = await getPublishedTrainingProgramBySlug(program.slug);
  const metadataProgram =
    directusProgram.ok && directusProgram.data
      ? mergeDirectusTrainingProgram(program, directusProgram.data)
      : program;
  return {
    title: `${localize(metadataProgram.title, params.locale)} | SynergyMazeAI`,
    description: localize(metadataProgram.shortDescription, params.locale)
  };
}

export default async function DataScienceMachineLearningPage({ params }: { params: { locale: Locale } }) {
  if (!program) notFound();
  const [directusProgram, currentUser] = await Promise.all([
    getPublishedTrainingProgramBySlug(program.slug),
    getCurrentUserProfile()
  ]);
  if (directusProgram.ok && !directusProgram.data) notFound();

  const displayProgram =
    directusProgram.ok && directusProgram.data
      ? mergeDirectusTrainingProgram(program, directusProgram.data)
      : { ...program, applicationOpen: !currentUser, directusAvailable: false };
  const directusProfile = currentUser ? await getCurrentUserDirectusProfile() : null;
  const user = currentUser
    ? withDirectusProfilePhone(
        currentUser,
        directusProfile?.ok ? directusProfile.profile : null
      )
    : null;
  return <TrainingCoursePage locale={params.locale} program={displayProgram} user={user} />;
}
