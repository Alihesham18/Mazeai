import "server-only";

import { createItem, isDirectusError, readItems, withToken } from "@directus/sdk";
import { unstable_noStore as noStore } from "next/cache";
import { createDirectusRestClient } from "./client";
import { directusAuthErrorCode, getAuthenticatedDirectusSession } from "./auth";
import type {
  DirectusScholarshipRule,
  DirectusTrainingProgram
} from "./types";
import type { ScholarshipAttemptStatus } from "@/lib/scholarship/types";
import { generateDiscountCode } from "@/lib/scholarship/scoring.server";

type ScholarshipBackendError = "configuration" | "collision" | "requestFailed" | "sessionExpired";
type ScholarshipBackendResult<T> =
  { ok: true; data: T } | { ok: false; error: ScholarshipBackendError };

const serviceRuleFields = [
  "id",
  "training_program",
  "minimum_percentage",
  "discount_percentage",
  "active"
] as const;

const accountAttemptFields = [
  "id",
  "score",
  "total_questions",
  "percentage",
  "scholarship_percentage",
  "discount_code",
  "status",
  "date_created",
  { training_program: ["id", "slug", "title"] }
] as const;

function scholarshipServiceToken() {
  return process.env.DIRECTUS_SCHOLARSHIP_TOKEN?.trim() || null;
}

function isUniqueConflict(error: unknown) {
  if (!isDirectusError(error)) return false;
  return error.errors.some((entry) => {
    const details = `${entry.extensions?.code ?? ""} ${entry.message}`.toLowerCase();
    return details.includes("unique") || details.includes("duplicate");
  });
}

export async function getActiveScholarshipRules(): Promise<
  ScholarshipBackendResult<DirectusScholarshipRule[]>
> {
  noStore();
  const client = createDirectusRestClient();
  const token = scholarshipServiceToken();
  if (!client || !token) return { ok: false, error: "configuration" };

  try {
    const rules = await client.request(
      withToken(
        token,
        readItems("scholarship_rules", {
          fields: serviceRuleFields,
          filter: { active: { _eq: true } }
        })
      )
    );
    return {
      ok: true,
      data: rules.flatMap((rule) => {
        const minimumPercentage = Number(rule.minimum_percentage);
        const discountPercentage = Number(rule.discount_percentage);
        return Number.isFinite(minimumPercentage) && Number.isFinite(discountPercentage)
          ? [
              {
                ...rule,
                minimum_percentage: minimumPercentage,
                discount_percentage: discountPercentage
              }
            ]
          : [];
      })
    };
  } catch {
    return { ok: false, error: "requestFailed" };
  }
}

export interface TrustedScholarshipAttemptInput {
  userId: string;
  programId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  scholarshipPercentage: number | null;
  status: ScholarshipAttemptStatus;
}

export async function createTrustedScholarshipAttempt(
  input: TrustedScholarshipAttemptInput,
  options: { codeFactory?: () => string; maxCollisionRetries?: number } = {}
): Promise<ScholarshipBackendResult<{ discountCode: string | null }>> {
  const client = createDirectusRestClient();
  const token = scholarshipServiceToken();
  if (!client || !token) return { ok: false, error: "configuration" };

  const eligible = input.status === "eligible" && input.scholarshipPercentage !== null;
  const codeFactory = options.codeFactory ?? generateDiscountCode;
  const maxAttempts = eligible ? (options.maxCollisionRetries ?? 4) + 1 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const discountCode = eligible ? codeFactory() : null;
    try {
      await client.request(
        withToken(
          token,
          createItem("scholarship_exam_attempts", {
            user: input.userId,
            training_program: input.programId,
            score: input.score,
            total_questions: input.totalQuestions,
            percentage: input.percentage,
            scholarship_percentage: input.scholarshipPercentage,
            discount_code: discountCode,
            status: input.status
          })
        )
      );
      return { ok: true, data: { discountCode } };
    } catch (caught) {
      if (!eligible || !isUniqueConflict(caught)) {
        return { ok: false, error: "requestFailed" };
      }
    }
  }

  return { ok: false, error: "collision" };
}

export interface AccountScholarshipAttempt {
  id: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  scholarshipPercentage: number | null;
  discountCode: string | null;
  status: ScholarshipAttemptStatus;
  dateCreated: string | null;
  program: Pick<DirectusTrainingProgram, "id" | "slug" | "title"> | null;
}

export async function getCurrentUserScholarshipAttempts(): Promise<
  ScholarshipBackendResult<AccountScholarshipAttempt[]>
> {
  noStore();
  const client = createDirectusRestClient();
  const session = await getAuthenticatedDirectusSession();
  if (!client || !session) return { ok: false, error: "sessionExpired" };

  try {
    const attempts = await client.request(
      withToken(
        session.accessToken,
        readItems("scholarship_exam_attempts", {
          fields: accountAttemptFields,
          sort: ["-date_created"]
        })
      )
    );
    return {
      ok: true,
      data: attempts.map((attempt) => ({
        id: attempt.id,
        score: Number(attempt.score),
        totalQuestions: Number(attempt.total_questions),
        percentage: Number(attempt.percentage),
        scholarshipPercentage:
          attempt.scholarship_percentage === null
            ? null
            : Number(attempt.scholarship_percentage),
        discountCode: attempt.discount_code,
        status: attempt.status,
        dateCreated: attempt.date_created,
        program: typeof attempt.training_program === "string" ? null : attempt.training_program
      }))
    };
  } catch (caught) {
    const error = directusAuthErrorCode(caught);
    return {
      ok: false,
      error: error === "sessionExpired" ? "sessionExpired" : "requestFailed"
    };
  }
}
