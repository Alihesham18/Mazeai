import type { Metadata } from "next";
import { TrainingCatalogPage } from "@/components/pages/TrainingCatalogPage";
import { trainingCopy } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/utilities/localize";

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  return {
    title: `${localize(trainingCopy.academy, params.locale)} | SynergyMazeAI`,
    description: localize(trainingCopy.description, params.locale)
  };
}

export default function TrainingPage({ params }: { params: { locale: Locale } }) {
  return <TrainingCatalogPage locale={params.locale} />;
}
