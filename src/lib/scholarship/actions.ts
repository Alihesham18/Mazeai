"use server";

import { revalidatePath } from "next/cache";
import { getCurrentDirectusUser } from "@/lib/directus/auth";
import { logDirectusDiagnostic } from "@/lib/directus/diagnostics";
import {
  createTrustedScholarshipAttempt,
  getActiveScholarshipRules,
  getCurrentUserScholarshipAttemptForProgram
} from "@/lib/directus/scholarship";
import type { DirectusTrainingProgram } from "@/lib/directus/types";
import { getPublishedTrainingProgramBySlug } from "@/lib/directus/training";
import { getScholarshipExam } from "@/data/scholarship-exams";
import { scoreScholarshipExam, selectScholarshipRule } from "./scoring.server";
import type { ScholarshipAnswerSubmission, ScholarshipSubmissionState } from "./types";

const scholarshipSubmissionLocks = new Map<string, Promise<void>>();
const maximumAnswerPayloadLength = 20_000;
const maximumScholarshipQuestions = 50;

function parseAnswers(formData: FormData): ScholarshipAnswerSubmission[] | null {
  if (
    Array.from(formData.keys()).some(
      (key) => key !== "answers" && !key.startsWith("$ACTION_")
    )
  ) {
    return null;
  }
  const raw = formData.get("answers");
  if (
    typeof raw !== "string" ||
    raw.length === 0 ||
    raw.length > maximumAnswerPayloadLength
  ) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !Array.isArray(parsed) ||
      parsed.length > maximumScholarshipQuestions
    ) {
      return null;
    }
    return parsed.every(
      (answer) =>
        typeof answer === "object" &&
        answer !== null &&
        Object.keys(answer).length === 2 &&
        Object.prototype.hasOwnProperty.call(answer, "questionId") &&
        Object.prototype.hasOwnProperty.call(answer, "selectedOption") &&
        typeof answer.questionId === "string" &&
        answer.questionId.length > 0 &&
        answer.questionId.length <= 128 &&
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
  let user;
  try {
    user = await getCurrentDirectusUser();
  } catch (caught) {
    logDirectusDiagnostic("scholarship-submission.authenticate", caught);
    return { status: "error", message: "sessionExpired" };
  }
  if (!user) return { status: "error", message: "sessionExpired" };

  const answers = parseAnswers(formData);
  if (!answers) return { status: "error", message: "invalidSubmission" };

  if (
    !programSlug ||
    programSlug.length > 128 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(programSlug)
  ) {
    return { status: "error", message: "examUnavailable" };
  }
  const exam = getScholarshipExam(programSlug);
  if (!exam || exam.programSlug !== programSlug) {
    return { status: "error", message: "examUnavailable" };
  }

  const programResult = await getPublishedTrainingProgramBySlug(programSlug);
  if (
    !programResult.ok ||
    !programResult.data ||
    programResult.data.slug !== exam.programSlug
  ) {
    return { status: "error", message: "examUnavailable" };
  }
  if (answers.length !== exam.questions.length) {
    return { status: "error", message: "incompleteSubmission" };
  }

  const lockKey = `${user.id}:${programResult.data.id}`;
  const previous = scholarshipSubmissionLocks.get(lockKey) ?? Promise.resolve();
  let release = () => {};
  const current = new Promise<void>((resolve) => (release = resolve));
  scholarshipSubmissionLocks.set(lockKey, current);
  await previous;

  try {
    return await submitScholarshipExamLocked({
      answers,
      program: programResult.data,
      programSlug,
      userId: user.id
    });
  } catch (caught) {
    logDirectusDiagnostic("scholarship-submission.unexpected", caught);
    return { status: "error", message: "submissionFailed" };
  } finally {
    release();
    if (scholarshipSubmissionLocks.get(lockKey) === current) {
      scholarshipSubmissionLocks.delete(lockKey);
    }
  }
}

async function submitScholarshipExamLocked({
  answers,
  program,
  programSlug,
  userId
}: {
  answers: ScholarshipAnswerSubmission[];
  program: DirectusTrainingProgram;
  programSlug: string;
  userId: string;
}): Promise<ScholarshipSubmissionState> {
  const existingAttempt = await getCurrentUserScholarshipAttemptForProgram(program.id, {
    prepareDiscount: { currency: program.currency }
  });
  if (!existingAttempt.ok) {
    return { status: "error", message: "attemptVerificationFailed" };
  }
  if (existingAttempt.data) {
    return {
      status: "alreadyAttempted",
      message: "alreadyAttempted",
      existingAttempt: existingAttempt.data
    };
  }

  const scored = scoreScholarshipExam(programSlug, answers);
  if (!scored) return { status: "error", message: "invalidSubmission" };

  const rulesResult = await getActiveScholarshipRules();
  if (!rulesResult.ok) return { status: "error", message: "submissionFailed" };

  const matchedRule = selectScholarshipRule(
    rulesResult.data,
    program.id,
    scored.percentage
  );
  const hasApplicableRules = rulesResult.data.some((rule) => {
    const relatedId =
      typeof rule.training_program === "string"
        ? rule.training_program
        : (rule.training_program?.id ?? null);
    return relatedId === program.id || relatedId === null;
  });
  const status = !hasApplicableRules ? "under_review" : matchedRule ? "eligible" : "not_eligible";
  const scholarshipPercentage = matchedRule?.discount_percentage ?? null;

  const finalAttemptCheck = await getCurrentUserScholarshipAttemptForProgram(program.id);
  if (!finalAttemptCheck.ok) {
    return { status: "error", message: "attemptVerificationFailed" };
  }
  if (finalAttemptCheck.data) {
    return {
      status: "alreadyAttempted",
      message: "alreadyAttempted",
      existingAttempt: finalAttemptCheck.data
    };
  }

  const createResult = await createTrustedScholarshipAttempt({
    userId,
    programId: program.id,
    ...scored,
    scholarshipPercentage,
    status,
    currency: program.currency
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
