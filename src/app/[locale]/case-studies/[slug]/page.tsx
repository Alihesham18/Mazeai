import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  CaseStudyDetailPage,
  CaseStudyLoadError
} from "@/components/pages/CaseStudyDetailPage";
import type { Locale } from "@/i18n/routing";
import { isInternalDemonstration } from "@/lib/case-studies/presentation";
import { getPublishedCaseStudyBySlug } from "@/lib/directus/case-studies";

interface CaseStudyPageProps {
  params: { locale: Locale; slug: string };
}

export async function generateMetadata({ params }: CaseStudyPageProps): Promise<Metadata> {
  const result = await getPublishedCaseStudyBySlug(params.slug, params.locale);
  if (!result.ok || !result.data) return {};
  const description = isInternalDemonstration(result.data)
    ? (await getTranslations({ locale: params.locale, namespace: "caseStudies" }))(
        "detail.metadataDescription"
      )
    : result.data.shortDescription || undefined;
  return {
    title: `${result.data.title} | SynergyMazeAI`,
    description,
    alternates: { canonical: `/${params.locale}/case-studies/${result.data.slug}` }
  };
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const result = await getPublishedCaseStudyBySlug(params.slug, params.locale);
  if (!result.ok) return <CaseStudyLoadError locale={params.locale} />;
  if (!result.data) notFound();
  return <CaseStudyDetailPage caseStudy={result.data} locale={params.locale} />;
}
