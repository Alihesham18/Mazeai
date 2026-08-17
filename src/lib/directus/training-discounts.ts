import "server-only";

import { isDirectusError, readItems, updateItems, withToken } from "@directus/sdk";
import { unstable_noStore as noStore } from "next/cache";
import { createDirectusRestClient } from "./client";
import type {
  DirectusDiscountCode,
  DirectusDiscountRedemption,
  DirectusTrainingApplication,
  DirectusTrainingProgram,
  DiscountType
} from "./types";
import type { AccountEnrolledTraining } from "./training";

export type TrainingDiscountError =
  | "TRAINING_NOT_FOUND"
  | "TRAINING_NOT_ACCEPTED"
  | "FEE_MISSING"
  | "INVALID_FEE"
  | "INVALID_CURRENCY"
  | "REDEMPTION_NOT_FOUND"
  | "DISCOUNT_UNAVAILABLE"
  | "DISCOUNT_USED"
  | "DISCOUNT_REVOKED"
  | "CODE_INACTIVE"
  | "CODE_NOT_STARTED"
  | "CODE_EXPIRED"
  | "APPLIES_TO_MISMATCH"
  | "CURRENCY_MISMATCH"
  | "MALFORMED_DISCOUNT"
  | "ALREADY_DISCOUNTED"
  | "FORBIDDEN"
  | "SERVER_ERROR";

export interface TrainingDiscountQuote {
  applicationId: string;
  redemptionId: string;
  originalAmount: string;
  discountAmount: string;
  finalAmount: string;
  currency: string;
  discountCode: string;
  discountTitle: string | null;
  discountType: DiscountType;
  discountValue: number;
}

export interface AvailableTrainingDiscount {
  redemptionId: string;
  code: string;
  title: string | null;
  discountType: DiscountType;
  discountValue: number;
  currency: string;
}

export interface AppliedTrainingDiscount {
  redemptionId: string;
  code: string | null;
  title: string | null;
  originalAmount: string;
  discountAmount: string;
  finalAmount: string;
  currency: string;
}

export interface TrainingDiscountOverview {
  available: AvailableTrainingDiscount[];
  applied: AppliedTrainingDiscount | null;
}

type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: TrainingDiscountError };

const quoteProgramFields = ["id", "title", "fee", "currency"] as const;
const quoteApplicationFields = [
  "id",
  "status",
  "date_created",
  "user",
  { training_program: quoteProgramFields }
] as const;
const quoteCodeFields = [
  "id",
  "code",
  "title",
  "description",
  "discount_type",
  "discount_value",
  "currency",
  "starts_at",
  "expires_at",
  "applies_to",
  "is_active",
  "stackable",
  "max_redemptions",
  "max_redemptions_per_user",
  "reserved_for_user"
] as const;
const quoteRedemptionFields = [
  "id",
  "user",
  "status",
  "used_at",
  "used_for_type",
  "used_for_id",
  "original_amount",
  "discount_amount",
  "final_amount",
  "currency",
  { discount_code: quoteCodeFields }
] as const;

const applicationLocks = new Map<string, Promise<void>>();

function discountServiceToken() {
  return process.env.DIRECTUS_DISCOUNT_SERVICE_TOKEN?.trim() || null;
}

function normalizeCurrency(currency: string | null | undefined) {
  const normalized = currency?.trim().toUpperCase() ?? "";
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
}

function currencyScale(currency: string) {
  try {
    const scale = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits;
    return typeof scale === "number" ? scale : null;
  } catch {
    return null;
  }
}

function decimalParts(value: number | string) {
  const normalized = typeof value === "number" ? String(value) : value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  return { whole, fraction };
}

function decimalToMinor(value: number | string, scale: number) {
  const parts = decimalParts(value);
  if (!parts) return null;
  const kept = parts.fraction.slice(0, scale).padEnd(scale, "0");
  let minor = BigInt(parts.whole) * 10n ** BigInt(scale) + BigInt(kept || "0");
  if (parts.fraction.length > scale && Number(parts.fraction[scale]) >= 5) minor += 1n;
  return minor;
}

function decimalRatio(value: number | string) {
  const parts = decimalParts(value);
  if (!parts) return null;
  const denominator = 10n ** BigInt(parts.fraction.length);
  return {
    numerator: BigInt(`${parts.whole}${parts.fraction}`),
    denominator
  };
}

function divideRounded(numerator: bigint, denominator: bigint) {
  return (numerator + denominator / 2n) / denominator;
}

function minorToDecimal(value: bigint, scale: number) {
  if (scale === 0) return value.toString();
  const digits = value.toString().padStart(scale + 1, "0");
  return `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
}

export function calculateTrainingDiscount(input: {
  originalAmount: number | string;
  discountType: DiscountType;
  discountValue: number | string;
  currency: string;
}): ServiceResult<Pick<TrainingDiscountQuote, "originalAmount" | "discountAmount" | "finalAmount">> {
  const scale = currencyScale(input.currency);
  if (scale === null) return { ok: false, error: "INVALID_CURRENCY" };
  const original = decimalToMinor(input.originalAmount, scale);
  if (original === null || original < 0n) return { ok: false, error: "INVALID_FEE" };

  let discount: bigint;
  if (input.discountType === "percentage") {
    const ratio = decimalRatio(input.discountValue);
    if (!ratio || ratio.numerator <= 0n || ratio.numerator > 100n * ratio.denominator) {
      return { ok: false, error: "MALFORMED_DISCOUNT" };
    }
    discount = divideRounded(original * ratio.numerator, ratio.denominator * 100n);
  } else if (input.discountType === "fixed") {
    const fixed = decimalToMinor(input.discountValue, scale);
    if (fixed === null || fixed <= 0n) return { ok: false, error: "MALFORMED_DISCOUNT" };
    discount = fixed > original ? original : fixed;
  } else {
    return { ok: false, error: "MALFORMED_DISCOUNT" };
  }

  const finalAmount = original > discount ? original - discount : 0n;
  return {
    ok: true,
    data: {
      originalAmount: minorToDecimal(original, scale),
      discountAmount: minorToDecimal(discount, scale),
      finalAmount: minorToDecimal(finalAmount, scale)
    }
  };
}

function directusFailure(error: unknown): TrainingDiscountError {
  if (!isDirectusError(error)) return "SERVER_ERROR";
  const forbidden = error.errors.some((entry) => {
    const code = String(entry.extensions?.code ?? "").toUpperCase();
    return code.includes("FORBIDDEN") || code.includes("PERMISSION_DENIED");
  });
  return forbidden ? "FORBIDDEN" : "SERVER_ERROR";
}

function logTrainingDiscountError(operation: string, error: unknown) {
  const codes = isDirectusError(error)
    ? error.errors.map((entry) => entry.extensions?.code ?? "DIRECTUS_ERROR")
    : [error instanceof Error ? error.name : "UNKNOWN_ERROR"];
  console.error(`[Directus training discounts] ${operation} failed`, { codes });
}

function codeError(code: DirectusDiscountCode, currency: string, now = Date.now()) {
  if (!code.is_active) return "CODE_INACTIVE" as const;
  const startsAt = code.starts_at ? Date.parse(code.starts_at) : null;
  if (startsAt !== null && (!Number.isFinite(startsAt) || now < startsAt)) {
    return Number.isFinite(startsAt) ? "CODE_NOT_STARTED" as const : "MALFORMED_DISCOUNT" as const;
  }
  const expiresAt = code.expires_at ? Date.parse(code.expires_at) : null;
  if (expiresAt !== null && (!Number.isFinite(expiresAt) || now >= expiresAt)) {
    return Number.isFinite(expiresAt) ? "CODE_EXPIRED" as const : "MALFORMED_DISCOUNT" as const;
  }
  if (code.applies_to !== "training" && code.applies_to !== "all") {
    return "APPLIES_TO_MISMATCH" as const;
  }
  const codeCurrency = normalizeCurrency(code.currency);
  if (!codeCurrency || codeCurrency !== currency) return "CURRENCY_MISMATCH" as const;
  const value = Number(code.discount_value);
  if (!Number.isFinite(value) || value <= 0) return "MALFORMED_DISCOUNT" as const;
  if (code.discount_type === "percentage" && value > 100) {
    return "MALFORMED_DISCOUNT" as const;
  }
  if (code.discount_type !== "percentage" && code.discount_type !== "fixed") {
    return "MALFORMED_DISCOUNT" as const;
  }
  return null;
}

function expandedCode(redemption: DirectusDiscountRedemption) {
  return typeof redemption.discount_code === "string" ? null : redemption.discount_code;
}

async function readOwnedTrainingApplication(input: {
  accessToken: string;
  userId: string;
  applicationId: string;
}) {
  const client = createDirectusRestClient();
  if (!client) throw new Error("Directus is not configured");
  const applications = await client.request(
    withToken(
      input.accessToken,
      readItems("training_applications", {
        fields: quoteApplicationFields,
        filter: { id: { _eq: input.applicationId }, user: { _eq: input.userId } },
        limit: 1
      })
    )
  );
  return applications[0] ?? null;
}

async function readOwnedRedemption(userId: string, redemptionId: string) {
  const client = createDirectusRestClient();
  const token = discountServiceToken();
  if (!client || !token) throw new Error("Discount service is not configured");
  const redemptions = await client.request(
    withToken(
      token,
      readItems("discount_redemptions", {
        fields: quoteRedemptionFields,
        filter: { id: { _eq: redemptionId }, user: { _eq: userId } },
        limit: 1
      })
    )
  );
  return redemptions[0] ?? null;
}

async function readAppliedForTraining(userId: string, applicationId: string) {
  const client = createDirectusRestClient();
  const token = discountServiceToken();
  if (!client || !token) throw new Error("Discount service is not configured");
  const redemptions = await client.request(
    withToken(
      token,
      readItems("discount_redemptions", {
        fields: quoteRedemptionFields,
        filter: {
          user: { _eq: userId },
          status: { _eq: "used" },
          used_for_type: { _eq: "training" },
          used_for_id: { _eq: applicationId }
        },
        limit: 1
      })
    )
  );
  return redemptions[0] ?? null;
}

export async function quoteTrainingDiscount(input: {
  accessToken: string;
  userId: string;
  applicationId: string;
  redemptionId: string;
}): Promise<ServiceResult<TrainingDiscountQuote>> {
  noStore();
  try {
    const [application, redemption, alreadyApplied] = await Promise.all([
      readOwnedTrainingApplication(input),
      readOwnedRedemption(input.userId, input.redemptionId),
      readAppliedForTraining(input.userId, input.applicationId)
    ]);
    if (!application) return { ok: false, error: "TRAINING_NOT_FOUND" };
    if (application.status !== "accepted") return { ok: false, error: "TRAINING_NOT_ACCEPTED" };
    if (alreadyApplied) return { ok: false, error: "ALREADY_DISCOUNTED" };
    if (!redemption) return { ok: false, error: "REDEMPTION_NOT_FOUND" };
    if (redemption.status === "used") return { ok: false, error: "DISCOUNT_USED" };
    if (redemption.status === "revoked") return { ok: false, error: "DISCOUNT_REVOKED" };
    if (redemption.status !== "available") return { ok: false, error: "DISCOUNT_UNAVAILABLE" };

    const program = application.training_program;
    if (!program || typeof program === "string") return { ok: false, error: "TRAINING_NOT_FOUND" };
    if (program.fee === null) return { ok: false, error: "FEE_MISSING" };
    const currency = normalizeCurrency(program.currency);
    if (!currency) return { ok: false, error: "INVALID_CURRENCY" };
    const code = expandedCode(redemption);
    if (!code) return { ok: false, error: "DISCOUNT_UNAVAILABLE" };
    const validationError = codeError(code, currency);
    if (validationError) return { ok: false, error: validationError };

    const amounts = calculateTrainingDiscount({
      originalAmount: program.fee,
      discountType: code.discount_type,
      discountValue: code.discount_value,
      currency
    });
    if (!amounts.ok) return amounts;
    return {
      ok: true,
      data: {
        applicationId: application.id,
        redemptionId: redemption.id,
        ...amounts.data,
        currency,
        discountCode: code.code,
        discountTitle: code.title,
        discountType: code.discount_type,
        discountValue: Number(code.discount_value)
      }
    };
  } catch (caught) {
    logTrainingDiscountError("quote", caught);
    return { ok: false, error: directusFailure(caught) };
  }
}

export async function applyTrainingDiscount(input: {
  accessToken: string;
  userId: string;
  applicationId: string;
  redemptionId: string;
}): Promise<ServiceResult<TrainingDiscountQuote>> {
  const lockKey = `${input.userId}:${input.applicationId}`;
  const previous = applicationLocks.get(lockKey) ?? Promise.resolve();
  let release = () => {};
  const current = new Promise<void>((resolve) => (release = resolve));
  applicationLocks.set(lockKey, current);
  await previous;

  try {
    const initial = await quoteTrainingDiscount(input);
    if (!initial.ok) return initial;
    // Re-read every trusted value immediately before the conditional update.
    const final = await quoteTrainingDiscount(input);
    if (!final.ok) return final;

    const client = createDirectusRestClient();
    const token = discountServiceToken();
    if (!client || !token) return { ok: false, error: "SERVER_ERROR" };
    const updated = await client.request(
      withToken(
        token,
        updateItems(
          "discount_redemptions",
          {
            filter: {
              id: { _eq: input.redemptionId },
              user: { _eq: input.userId },
              status: { _eq: "available" }
            }
          },
          {
            status: "used",
            used_at: new Date().toISOString(),
            used_for_type: "training",
            used_for_id: input.applicationId,
            original_amount: final.data.originalAmount,
            discount_amount: final.data.discountAmount,
            final_amount: final.data.finalAmount,
            currency: final.data.currency
          },
          { fields: ["id", "status", "used_at"] }
        )
      )
    );
    return updated[0]
      ? final
      : { ok: false, error: "DISCOUNT_UNAVAILABLE" };
  } catch (caught) {
    logTrainingDiscountError("apply", caught);
    return { ok: false, error: directusFailure(caught) };
  } finally {
    release();
    if (applicationLocks.get(lockKey) === current) applicationLocks.delete(lockKey);
  }
}

export async function getTrainingDiscountOverview(
  userId: string,
  trainings: AccountEnrolledTraining[]
): Promise<ServiceResult<Record<string, TrainingDiscountOverview>>> {
  noStore();
  const client = createDirectusRestClient();
  const token = discountServiceToken();
  if (!client || !token) return { ok: false, error: "SERVER_ERROR" };
  try {
    const redemptions = await client.request(
      withToken(
        token,
        readItems("discount_redemptions", {
          fields: quoteRedemptionFields,
          filter: { user: { _eq: userId }, status: { _in: ["available", "used"] } },
          sort: ["-date_created"]
        })
      )
    );
    const result: Record<string, TrainingDiscountOverview> = {};
    for (const training of trainings) {
      const currency = normalizeCurrency(training.program.currency);
      const appliedRecord = redemptions.find(
        (redemption) =>
          redemption.status === "used" &&
          redemption.used_for_type === "training" &&
          redemption.used_for_id === training.applicationId
      );
      const appliedCode = appliedRecord ? expandedCode(appliedRecord) : null;
      const applied =
        appliedRecord &&
        appliedRecord.original_amount !== null &&
        appliedRecord.discount_amount !== null &&
        appliedRecord.final_amount !== null &&
        normalizeCurrency(appliedRecord.currency)
          ? {
              redemptionId: appliedRecord.id,
              code: appliedCode?.code ?? null,
              title: appliedCode?.title ?? null,
              originalAmount: String(appliedRecord.original_amount),
              discountAmount: String(appliedRecord.discount_amount),
              finalAmount: String(appliedRecord.final_amount),
              currency: normalizeCurrency(appliedRecord.currency) as string
            }
          : null;
      const available = currency
        ? redemptions.flatMap((redemption) => {
            if (redemption.status !== "available") return [];
            const code = expandedCode(redemption);
            if (!code || codeError(code, currency)) return [];
            return [{
              redemptionId: redemption.id,
              code: code.code,
              title: code.title,
              discountType: code.discount_type,
              discountValue: Number(code.discount_value),
              currency
            }];
          })
        : [];
      result[training.applicationId] = { available: applied ? [] : available, applied };
    }
    return { ok: true, data: result };
  } catch (caught) {
    logTrainingDiscountError("overview", caught);
    return { ok: false, error: directusFailure(caught) };
  }
}
