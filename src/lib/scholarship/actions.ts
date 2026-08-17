"use server";

import { revalidatePath } from "next/cache";
import { getCurrentDirectusUser } from "@/lib/directus/auth";
import {
  createTrustedScholarshipAttempt,
  getActiveScholarshipRules
} from "@/lib/directus/scholarship";
import { getPublishedTrainingProgramBySlug } from "@/lib/directus/training";
import { scoreScholarshipExam, selectScholarshipRule } from "./scoring.server";
import type { ScholarshipAnswerSubmission, ScholarshipSubmissionState } from "./types";

function parseAnswers(formData: FormData): ScholarshipAnswerSubmission[] | null {
  if (
    Array.from(formData.keys()).some(
      (key) => key !== "answers" && !key.startsWith("$ACTION_")
    )
  ) {
    return null;
  }
  const raw = formData.get("answers");
  if (typeof raw !== "string") return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.every(
      (answer) =>
        typeof answer === "object" &&
        answer !== null &&
        typeof answer.questionId === "string" &&
        Number.isInteger(answer.selectedOption)
    )
      ? (parsed as ScholarshipAnswerSubmission[])
      : null;
  } catch {
    return null;
  }
}

export async function submitScholarshipExamAction(
  programSlug: string,
  _previousState: ScholarshipSubmissionState,
  formData: FormData
): Promise<ScholarshipSubmissionState> {
  const user = await getCurrentDirectusUser();
  if (!user) return { status: "error", message: "sessionExpired" };

  const answers = parseAnswers(formData);
  if (!answers) return { status: "error", message: "invalidSubmission" };

  const programResult = await getPublishedTrainingProgramBySlug(programSlug);
  if (!programResult.ok || !programResult.data) {
    return { status: "error", message: "invalidSubmission" };
  }

  const scored = scoreScholarshipExam(programSlug, answers);
  if (!scored) return { status: "error", message: "invalidSubmission" };

  const rulesResult = await getActiveScholarshipRules();
  if (!rulesResult.ok) return { status: "error", message: "submissionFailed" };

  const matchedRule = selectScholarshipRule(
    rulesResult.data,
    programResult.data.id,
    scored.percentage
  );
  const hasApplicableRules = rulesResult.data.some((rule) => {
    const relatedId =
      typeof rule.training_program === "string"
        ? rule.training_program
        : (rule.training_program?.id ?? null);
    return relatedId === programResult.data?.id || relatedId === null;
  });
  const status = !hasApplicableRules ? "under_review" : matchedRule ? "eligible" : "not_eligible";
  const scholarshipPercentage = matchedRule?.discount_percentage ?? null;

  const createResult = await createTrustedScholarshipAttempt({
    userId: user.id,
    programId: programResult.data.id,
    ...scored,
    scholarshipPercentage,
    status,
    currency: programResult.data.currency
  });
  if (!createResult.ok) return { status: "error", message: "submissionFailed" };

  revalidatePath("/", "layout");
  return {
    status: "success",
    result: {
      ...scored,
      scholarshipPercentage,
      discountCode: createResult.data.discountCode,
      discountReady: createResult.data.discountReady,
      status
    }
  };
}
