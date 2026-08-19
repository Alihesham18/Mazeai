import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { ScholarshipExam } from "@/components/training/ScholarshipExam";
import { getScholarshipExam, scholarshipExamCopy } from "@/data/scholarship-exams";
import { getScholarshipProgram, scholarshipPrograms } from "@/data/scholarship-programs";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/utilities/localize";
import { getCurrentUserProfile, withDirectusProfilePhone } from "@/lib/auth/user";
import { getCurrentUserDirectusProfile } from "@/lib/directus/profile";
import { getCurrentUserScholarshipAttemptForProgram } from "@/lib/directus/scholarship";
import { getPublishedTrainingProgramBySlug } from "@/lib/directus/training";
import type { ScholarshipProgramSummary } from "@/lib/scholarship/types";

export function generateStaticParams() {
  return scholarshipPrograms
    .filter((program) => getScholarshipExam(program.slug))
    .map((program) => ({ slug: program.slug }));
}

export function generateMetadata({
  params
}: {
  params: { locale: Locale; slug: string };
}): Metadata {
  const program = getScholarshipProgram(params.slug);
  const exam = getScholarshipExam(params.slug);

  if (!program || !exam) return {};

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
  const program = getScholarshipProgram(params.slug);
  const exam = getScholarshipExam(params.slug);

  if (!program || !exam) {
    notFound();
  }

  const programSummary: ScholarshipProgramSummary = {
    slug: program.slug,
    title: localize(program.title, params.locale)
  };

  const currentUser = await getCurrentUserProfile();
  const directusProfile = currentUser ? await getCurrentUserDirectusProfile() : null;
  const user = currentUser
    ? withDirectusProfilePhone(currentUser, directusProfile?.ok ? directusProfile.profile : null)
    : null;
  const t = await getTranslations({ locale: params.locale, namespace: "scholarshipExam" });
  let existingAttempt = null;
  let attemptCheckFailed = false;

  if (currentUser) {
    const programResult = await getPublishedTrainingProgramBySlug(params.slug);
    if (!programResult.ok || !programResult.data) {
      attemptCheckFailed = true;
    } else {
      const attemptResult = await getCurrentUserScholarshipAttemptForProgram(
        programResult.data.id,
        {
          prepareDiscount: {
            currency: programResult.data.currency
          }
        }
      );
      if (attemptResult.ok) existingAttempt = attemptResult.data;
      else attemptCheckFailed = true;
    }
  }

  return (
    <Container>
      <ScholarshipExam
        attemptCheckFailed={attemptCheckFailed}
        attemptLabels={{
          completedTitle: t("completedTitle"),
          alreadyCompleted: t("alreadyCompleted"),
          viewAttempts: t("viewAttempts"),
          oneAttemptOnly: t("oneAttemptOnly"),
          unableVerifyPreviousAttempts: t("unableVerifyPreviousAttempts"),
          authenticationRequired: t("authenticationRequired"),
          unansweredQuestions: t("unansweredQuestions"),
          invalidSubmission: t("invalidSubmission"),
          examUnavailable: t("examUnavailable"),
          submissionFailure: t("submissionFailure"),
          discountPreparing: t("discountPreparing")
        }}
        existingAttempt={existingAttempt}
        locale={params.locale}
        program={programSummary}
        exam={exam}
        user={user}
      />
    </Container>
  );
}
