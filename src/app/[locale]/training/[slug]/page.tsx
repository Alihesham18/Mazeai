import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrainingCoursePage } from "@/components/pages/TrainingCoursePage";
import { getTrainingProgram, trainingPrograms } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/utilities/localize";
import { getCurrentUserProfile } from "@/lib/auth/user";

export function generateStaticParams() {
  return trainingPrograms.map((program) => ({ slug: program.slug }));
}

export function generateMetadata({
  params
}: {
  params: { locale: Locale; slug: string };
}): Metadata {
  const program = getTrainingProgram(params.slug);

  if (!program) return {};

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
  const program = getTrainingProgram(params.slug);

  if (!program) notFound();

  const user = await getCurrentUserProfile();
  return <TrainingCoursePage locale={params.locale} program={program} user={user} />;
}
