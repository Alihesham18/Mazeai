import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrainingCoursePage } from "@/components/pages/TrainingCoursePage";
import { getTrainingProgram } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/utilities/localize";

const program = getTrainingProgram("data-science-machine-learning");

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  if (!program) return {};
  return {
    title: `${localize(program.title, params.locale)} | SynergyMazeAI`,
    description: localize(program.shortDescription, params.locale)
  };
}

export default function DataScienceMachineLearningPage({ params }: { params: { locale: Locale } }) {
  if (!program) notFound();
  return <TrainingCoursePage locale={params.locale} program={program} />;
}
