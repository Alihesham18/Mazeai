import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TrainingCatalogPage } from "@/components/pages/TrainingCatalogPage";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "training" });
  return {
    title: `${t("academy")} | SynergyMazeAI`,
    description: t("description")
  };
}

export default function TrainingPage({ params }: { params: { locale: Locale } }) {
  return <TrainingCatalogPage locale={params.locale} />;
}
