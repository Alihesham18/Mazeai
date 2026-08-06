import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectCaseStudyPage } from "@/components/pages/ProjectCaseStudyPage";
import { getWebDevelopmentProject } from "@/data/web-development-projects";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/utilities/localize";

const project = getWebDevelopmentProject("nlp-assist");

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  if (!project) return {};
  return {
    title: `${localize(project.title, params.locale)} | SynergyMazeAI`,
    description: localize(project.overview, params.locale)
  };
}

export default function NlpAssistPage({ params }: { params: { locale: Locale } }) {
  if (!project) notFound();
  return <ProjectCaseStudyPage locale={params.locale} project={project} />;
}
