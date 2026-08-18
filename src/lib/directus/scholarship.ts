import "server-only";

import { createItem, isDirectusError, readItems, withToken } from "@directus/sdk";
import { unstable_noStore as noStore } from "next/cache";
import { createDirectusRestClient } from "./client";
import { logDirectusDiagnostic } from "./diagnostics";
import {
  directusAuthErrorCode,
  getAuthenticatedDirectusSession,
  getCurrentDirectusUser
} from "./auth";
import {
  ensureScholarshipDiscountCode,
  scholarshipDiscountCodeExists
} from "./discounts";
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
  { training_program: ["id", "slug", "title", "currency"] }
] as const;

const existingAttemptFields = [
  "id",
  "score",
  "total_questions",
  "percentage",
  "scholarship_percentage",
  "discount_code",
  "status",
  "date_created"
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
  } catch (caught) {
    logDirectusDiagnostic("scholarship-rules.read", caught);
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
  currency: string | null;
}

export interface ExistingScholarshipAttempt {
  id: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  scholarshipPercentage: number | null;
  discountCode: string | null;
  discountReady: boolean;
  hasHistoricDuplicates: boolean;
  status: ScholarshipAttemptStatus;
  dateCreated: string | null;
}

export async function getCurrentUserScholarshipAttemptForProgram(
  programId: string,
  options: {
    prepareDiscount?: { currency: string | null };
  } = {}
): Promise<ScholarshipBackendResult<ExistingScholarshipAttempt | null>> {
  noStore();
  const client = createDirectusRestClient();
  let session;
  try {
    session = await getAuthenticatedDirectusSession();
  } catch (caught) {
    logDirectusDiagnostic("scholarship-attempts.verify-authentication", caught);
    return { ok: false, error: "sessionExpired" };
  }
  if (!client || !session) return { ok: false, error: "sessionExpired" };

  try {
    const attempts = await client.request(
      withToken(
        session.accessToken,
        readItems("scholarship_exam_attempts", {
          fields: existingAttemptFields,
          filter: { training_program: { _eq: programId } },
          sort: ["date_created", "id"],
          limit: 2
        })
      )
    );
    const attempt = attempts[0];
    if (!attempt) return { ok: true, data: null };

    const data: ExistingScholarshipAttempt = {
      id: attempt.id,
      score: Number(attempt.score),
      totalQuestions: Number(attempt.total_questions),
      percentage: Number(attempt.percentage),
      scholarshipPercentage:
        attempt.scholarship_percentage === null
          ? null
          : Number(attempt.scholarship_percentage),
      discountCode:
        typeof attempt.discount_code === "string" && attempt.discount_code.trim()
          ? attempt.discount_code
          : null,
      discountReady: false,
      hasHistoricDuplicates: attempts.length > 1,
      status: attempt.status,
      dateCreated: attempt.date_created
    };

    const preparation = options.prepareDiscount;
    const currency = preparation?.currency?.trim().toUpperCase() ?? "";
    if (
      preparation &&
      !data.hasHistoricDuplicates &&
      data.status === "eligible" &&
      data.discountCode &&
      data.scholarshipPercentage !== null &&
      /^[A-Z]{3}$/.test(currency)
    ) {
      try {
        const currentUser = await getCurrentDirectusUser();
        if (!currentUser) return { ok: false, error: "sessionExpired" };
        const synchronized = await ensureScholarshipDiscountCode({
          code: data.discountCode,
          userId: currentUser.id,
          awardPercentage: data.scholarshipPercentage,
          currency
        });
        data.discountReady = synchronized.ok;
      } catch (caught) {
        logDirectusDiagnostic("scholarship-attempts.prepare-existing-discount", caught);
      }
    }

    return { ok: true, data };
  } catch (caught) {
    logDirectusDiagnostic("scholarship-attempts.verify-current-user-program", caught);
    return {
      ok: false,
      error:
        directusAuthErrorCode(caught) === "sessionExpired"
          ? "sessionExpired"
          : "requestFailed"
    };
  }
}

function normalizeCreatedScholarshipAttempt(value: unknown): {
  attemptId: string;
  discountCode: string | null;
} | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || !record.id.trim()) return null;
  if (!Object.prototype.hasOwnProperty.call(record, "discount_code")) return null;
  return {
    attemptId: record.id,
    discountCode:
      typeof record.discount_code === "string" && record.discount_code.trim()
        ? record.discount_code
        : null
  };
}

async function recoverPersistedScholarshipAttempt(input: {
  programId: string;
  userId: string;
  currency: string;
}): Promise<{
  attemptId: string;
  discountCode: string | null;
  discountReady: boolean;
} | null> {
  const recovered = await getCurrentUserScholarshipAttemptForProgram(input.programId);
  if (!recovered.ok || !recovered.data) return null;
  const { discountCode, hasHistoricDuplicates, scholarshipPercentage, status } =
    recovered.data;
  const currency = input.currency.trim().toUpperCase();
  if (
    hasHistoricDuplicates ||
    status !== "eligible" ||
    scholarshipPercentage === null ||
    !discountCode ||
    !/^[A-Z]{3}$/.test(currency)
  ) {
    return {
      attemptId: recovered.data.id,
      discountCode,
      discountReady: false
    };
  }

  try {
    const synchronized = await ensureScholarshipDiscountCode({
      code: discountCode,
      userId: input.userId,
      awardPercentage: scholarshipPercentage,
      currency
    });
    return {
      attemptId: recovered.data.id,
      discountCode,
      discountReady: synchronized.ok
    };
  } catch (caught) {
    logDirectusDiagnostic("scholarship-attempts.recover-discount", caught);
    return {
      attemptId: recovered.data.id,
      discountCode,
      discountReady: false
    };
  }
}

export async function createTrustedScholarshipAttempt(
  input: TrustedScholarshipAttemptInput,
  options: { codeFactory?: () => string; maxCollisionRetries?: number } = {}
): Promise<
  ScholarshipBackendResult<{
    attemptId: string;
    discountCode: string | null;
    discountReady: boolean;
  }>
> {
  const client = createDirectusRestClient();
  const token = scholarshipServiceToken();
  if (!client || !token) return { ok: false, error: "configuration" };

  const eligible = input.status === "eligible" && input.scholarshipPercentage !== null;
  const codeFactory = options.codeFactory ?? generateDiscountCode;
  const maxAttempts = eligible ? (options.maxCollisionRetries ?? 4) + 1 : 1;

  const award = input.scholarshipPercentage === null ? null : Number(input.scholarshipPercentage);
  const currency = input.currency?.trim().toUpperCase() ?? "";
  if (
    eligible &&
    (!Number.isFinite(award) || Number(award) <= 0 || Number(award) > 100 || !/^[A-Z]{3}$/.test(currency))
  ) {
    return { ok: false, error: "requestFailed" };
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const discountCode = eligible ? codeFactory() : null;
    if (discountCode) {
      const availability = await scholarshipDiscountCodeExists(discountCode);
      if (!availability.ok) return { ok: false, error: "requestFailed" };
      if (availability.exists) continue;
    }
    try {
      const createResponse = await client.request(
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
          }, { fields: ["id", "discount_code"] })
        )
      );
      const created = normalizeCreatedScholarshipAttempt(createResponse);
      if (!created) {
        const recovered = await recoverPersistedScholarshipAttempt({
          programId: input.programId,
          userId: input.userId,
          currency
        });
        if (recovered) return { ok: true, data: recovered };
        return { ok: false, error: "requestFailed" };
      }
      if (!discountCode || award === null) {
        return {
          ok: true,
          data: {
            attemptId: created.attemptId,
            discountCode: created.discountCode,
            discountReady: false
          }
        };
      }

      const persistedDiscountCode = created.discountCode;
      if (!persistedDiscountCode) {
        const recovered = await recoverPersistedScholarshipAttempt({
          programId: input.programId,
          userId: input.userId,
          currency
        });
        if (recovered) return { ok: true, data: recovered };
        return {
          ok: true,
          data: { attemptId: created.attemptId, discountCode: null, discountReady: false }
        };
      }

      const synchronized = await ensureScholarshipDiscountCode({
        code: persistedDiscountCode,
        userId: input.userId,
        awardPercentage: award,
        currency
      });
      return {
        ok: true,
        data: {
          attemptId: created.attemptId,
          discountCode: persistedDiscountCode,
          discountReady: synchronized.ok
        }
      };
    } catch (caught) {
      const recovered = await recoverPersistedScholarshipAttempt({
        programId: input.programId,
        userId: input.userId,
        currency
      });
      if (recovered) return { ok: true, data: recovered };
      if (!eligible || !isUniqueConflict(caught)) {
        logDirectusDiagnostic("scholarship-attempts.create", caught);
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
  discountReady: boolean;
  status: ScholarshipAttemptStatus;
  dateCreated: string | null;
  program: Pick<DirectusTrainingProgram, "id" | "slug" | "title" | "currency"> | null;
}

export async function getCurrentUserScholarshipAttempts(): Promise<
  ScholarshipBackendResult<AccountScholarshipAttempt[]>
> {
  noStore();
  const client = createDirectusRestClient();
  let currentUser;
  let session;
  try {
    currentUser = await getCurrentDirectusUser();
    session = currentUser ? await getAuthenticatedDirectusSession() : null;
  } catch (caught) {
    logDirectusDiagnostic("scholarship-history.authenticate", caught);
    return { ok: false, error: "sessionExpired" };
  }
  if (!client || !session || !currentUser) return { ok: false, error: "sessionExpired" };

  let attempts;
  try {
    attempts = await client.request(
      withToken(
        session.accessToken,
        readItems("scholarship_exam_attempts", {
          fields: accountAttemptFields,
          sort: ["-date_created"]
        })
      )
    );
  } catch (caught) {
    logDirectusDiagnostic("scholarship-history.read-attempts", caught);
    const error = directusAuthErrorCode(caught);
    return {
      ok: false,
      error: error === "sessionExpired" ? "sessionExpired" : "requestFailed"
    };
  }

  const history = attempts.flatMap((attempt) => {
    try {
      const program =
        typeof attempt.training_program === "string" ? null : attempt.training_program;
      const scholarshipPercentage =
        attempt.scholarship_percentage === null
          ? null
          : Number(attempt.scholarship_percentage);
      return [{
        id: attempt.id,
        score: Number(attempt.score),
        totalQuestions: Number(attempt.total_questions),
        percentage: Number(attempt.percentage),
        scholarshipPercentage,
        discountCode:
          typeof attempt.discount_code === "string" ? attempt.discount_code : null,
        discountReady: false,
        status: attempt.status,
        dateCreated: attempt.date_created,
        program
      } satisfies AccountScholarshipAttempt];
    } catch (caught) {
      logDirectusDiagnostic("scholarship-history.transform-attempt", caught);
      return [];
    }
  });

  const programAttemptCounts = new Map<string, number>();
  for (const attempt of history) {
    if (attempt.program?.id) {
      programAttemptCounts.set(
        attempt.program.id,
        (programAttemptCounts.get(attempt.program.id) ?? 0) + 1
      );
    }
  }

  const data = await Promise.all(
    history.map(async (attempt) => {
      try {
        if (
          (attempt.program?.id && (programAttemptCounts.get(attempt.program.id) ?? 0) > 1) ||
          attempt.status !== "eligible" ||
          !attempt.discountCode?.trim() ||
          attempt.scholarshipPercentage === null ||
          !attempt.program?.currency
        ) {
          return attempt;
        }

        const synchronized = await ensureScholarshipDiscountCode({
          code: attempt.discountCode,
          userId: currentUser.id,
          awardPercentage: attempt.scholarshipPercentage,
          currency: attempt.program.currency
        });
        if (!synchronized.ok) {
          logDirectusDiagnostic(
            "scholarship-history.synchronize-discount",
            new Error(`Scholarship discount synchronization returned ${synchronized.error}`)
          );
        }
        return { ...attempt, discountReady: synchronized.ok };
      } catch (caught) {
        logDirectusDiagnostic("scholarship-history.synchronize-discount", caught);
        return attempt;
      }
    })
  );

  return { ok: true, data };
}
