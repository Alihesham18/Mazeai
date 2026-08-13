import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { ScholarshipExam } from "@/components/training/ScholarshipExam";
import { getScholarshipExam, scholarshipExamCopy } from "@/data/scholarship-exams";
import { getTrainingProgram, trainingPrograms } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/utilities/localize";
import { getCurrentUserProfile, withDirectusProfilePhone } from "@/lib/auth/user";
import { getCurrentUserDirectusProfile } from "@/lib/directus/profile";

export function generateStaticParams() {
  return trainingPrograms
    .filter((program) => program.category === "bootcamp" && getScholarshipExam(program.slug))
    .map((program) => ({ slug: program.slug }));
}

export function generateMetadata({
  params
}: {
  params: { locale: Locale; slug: string };
}): Metadata {
  const program = getTrainingProgram(params.slug);
  const exam = getScholarshipExam(params.slug);

  if (!program || program.category !== "bootcamp" || !exam) return {};

  return {
    title: `${localize(scholarshipExamCopy.label, params.locale)}: ${localize(
      program.title,
      params.locale
    )} | SynergyMazeAI`,
    description: localize(scholarshipExamCopy.intro, params.locale)
  };
}

export default async function TrainingScholarshipPage({
  params
}: {
  params: { locale: Locale; slug: string };
}) {
  setRequestLocale(params.locale);
  const program = getTrainingProgram(params.slug);
  const exam = getScholarshipExam(params.slug);

  if (!program || program.category !== "bootcamp" || !exam) {
    notFound();
  }

  const currentUser = await getCurrentUserProfile();
  const directusProfile = currentUser ? await getCurrentUserDirectusProfile() : null;
  const user = currentUser
    ? withDirectusProfilePhone(currentUser, directusProfile?.ok ? directusProfile.profile : null)
    : null;

  return (
    <Container>
      <ScholarshipExam locale={params.locale} program={program} exam={exam} user={user} />
    </Container>
  );
}
