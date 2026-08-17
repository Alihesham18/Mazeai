import "server-only";

import { createItem, isDirectusError, readItems, withToken } from "@directus/sdk";
import { unstable_noStore as noStore } from "next/cache";
import { createDirectusRestClient } from "./client";
import { logDirectusDiagnostic } from "./diagnostics";
import type {
  DirectusDiscountCode,
  DirectusDiscountRedemption,
  DiscountAppliesTo,
  DiscountRedemptionStatus,
  DiscountType
} from "./types";

export type DiscountRedemptionError =
  | "INVALID_CODE"
  | "CODE_INACTIVE"
  | "CODE_NOT_STARTED"
  | "CODE_EXPIRED"
  | "REDEMPTION_LIMIT_REACHED"
  | "USER_REDEMPTION_LIMIT_REACHED"
  | "SCHOLARSHIP_CODE_NOT_OWNED"
  | "SERVER_ERROR";

export type ScholarshipDiscountSyncError =
  | "INVALID_CODE"
  | "INVALID_AWARD"
  | "INVALID_CURRENCY"
  | "CONFLICT"
  | "COLLISION"
  | "SERVER_ERROR";

export type RedeemDiscountResult =
  | { ok: true; redemptionId: string }
  | { ok: false; error: DiscountRedemptionError };

export interface AccountDiscount {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  currency: string;
  appliesTo: DiscountAppliesTo;
  expiresAt: string | null;
  status: DiscountRedemptionStatus;
  displayStatus: DiscountRedemptionStatus | "expired";
}

const discountFields = [
  "id",
  "code",
  "title",
  "description",
  "discount_type",
  "discount_value",
  "currency",
  "starts_at",
  "expires_at",
  "max_redemptions",
  "max_redemptions_per_user",
  "applies_to",
  "is_active",
  "stackable",
  "reserved_for_user"
] as const;

const accountRedemptionFields = [
  "id",
  "status",
  "currency",
  "date_created",
  {
    discount_code: [
      "id",
      "code",
      "title",
      "description",
      "discount_type",
      "discount_value",
      "currency",
      "applies_to",
      "expires_at"
    ]
  }
] as const;

const redemptionLocks = new Map<string, Promise<void>>();
const scholarshipCodeLocks = new Map<string, Promise<void>>();

function discountServiceToken() {
  return process.env.DIRECTUS_DISCOUNT_SERVICE_TOKEN?.trim() || null;
}

export function normalizeDiscountCode(code: string) {
  return code.trim().toUpperCase();
}

function positiveLimit(value: number | null) {
  if (value === null) return null;
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : 0;
}

function validateCodeRecord(code: DirectusDiscountCode, now: Date): DiscountRedemptionError | null {
  if (!code.is_active) return "CODE_INACTIVE";

  const startsAt = code.starts_at ? Date.parse(code.starts_at) : null;
  if (startsAt !== null && (!Number.isFinite(startsAt) || now.getTime() < startsAt)) {
    return startsAt !== null && Number.isFinite(startsAt) ? "CODE_NOT_STARTED" : "SERVER_ERROR";
  }

  const expiresAt = code.expires_at ? Date.parse(code.expires_at) : null;
  if (expiresAt !== null && (!Number.isFinite(expiresAt) || now.getTime() >= expiresAt)) {
    return expiresAt !== null && Number.isFinite(expiresAt) ? "CODE_EXPIRED" : "SERVER_ERROR";
  }

  const value = Number(code.discount_value);
  if (!Number.isFinite(value) || value <= 0) return "SERVER_ERROR";
  if (code.discount_type === "percentage" && value > 100) return "SERVER_ERROR";
  if (code.discount_type !== "percentage" && code.discount_type !== "fixed") return "SERVER_ERROR";
  return null;
}

export function normalizeReservedUserId(user: DirectusDiscountCode["reserved_for_user"]) {
  if (!user) return null;
  const id = typeof user === "string" ? user : user.id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

function isConflict(error: unknown) {
  if (!isDirectusError(error)) return false;
  return error.errors.some((entry) => {
    const details = `${entry.extensions?.code ?? ""} ${entry.message}`.toLowerCase();
    return details.includes("unique") || details.includes("duplicate") || details.includes("conflict");
  });
}

function logDiscountError(operation: string, error: unknown) {
  logDirectusDiagnostic(`discounts.${operation}`, error);
}

async function requestContext() {
  const client = createDirectusRestClient();
  const token = discountServiceToken();
  return client && token ? { client, token } : null;
}

export async function getDiscountByCode(rawCode: string): Promise<DirectusDiscountCode | null> {
  noStore();
  const context = await requestContext();
  const code = normalizeDiscountCode(rawCode);
  if (!context) throw new Error("Discount service is not configured");
  if (!code) return null;

  const items = await context.client.request(
    withToken(
      context.token,
      readItems("discount_codes", {
        fields: discountFields,
        filter: { code: { _eq: code } },
        limit: 1
      })
    )
  );
  return items[0] ?? null;
}

export async function getDiscountRedemptionCount(discountId: string, userId?: string) {
  noStore();
  const context = await requestContext();
  if (!context) throw new Error("Discount service is not configured");

  const redemptions = await context.client.request(
    withToken(
      context.token,
      readItems("discount_redemptions", {
        fields: ["id"],
        filter: {
          discount_code: { _eq: discountId },
          status: { _neq: "revoked" },
          ...(userId ? { user: { _eq: userId } } : {})
        },
        limit: -1
      })
    )
  );
  return redemptions.length;
}

async function checkLimits(code: DirectusDiscountCode, userId: string) {
  const [globalCount, userCount] = await Promise.all([
    getDiscountRedemptionCount(code.id),
    getDiscountRedemptionCount(code.id, userId)
  ]);
  const globalLimit = positiveLimit(code.max_redemptions);
  const userLimit = positiveLimit(code.max_redemptions_per_user);

  if (globalLimit !== null && globalCount >= globalLimit) return "REDEMPTION_LIMIT_REACHED" as const;
  if (userLimit !== null && userCount >= userLimit) return "USER_REDEMPTION_LIMIT_REACHED" as const;
  return null;
}

async function redeemLocked(userId: string, normalizedCode: string): Promise<RedeemDiscountResult> {
  try {
    const code = await getDiscountByCode(normalizedCode);
    if (!code) return { ok: false, error: "INVALID_CODE" };

    const reservedUserId = normalizeReservedUserId(code.reserved_for_user);
    if (reservedUserId && reservedUserId !== userId) {
      return { ok: false, error: "SCHOLARSHIP_CODE_NOT_OWNED" };
    }

    const recordError = validateCodeRecord(code, new Date());
    if (recordError) return { ok: false, error: recordError };

    const limitError = await checkLimits(code, userId);
    if (limitError) return { ok: false, error: limitError };

    // Re-read the counts immediately before creation. The in-process lock prevents rapid
    // duplicates on one app instance; a DB transaction/constraint is still required for
    // absolute cross-instance enforcement and is intentionally not added here.
    const finalLimitError = await checkLimits(code, userId);
    if (finalLimitError) return { ok: false, error: finalLimitError };

    const context = await requestContext();
    if (!context) return { ok: false, error: "SERVER_ERROR" };
    const created = await context.client.request(
      withToken(
        context.token,
        createItem(
          "discount_redemptions",
          {
            user: userId,
            discount_code: code.id,
            status: "available",
            currency: code.currency?.trim() || "TRY"
          },
          { fields: ["id"] }
        )
      )
    );
    return { ok: true, redemptionId: created.id };
  } catch (caught) {
    if (isConflict(caught)) return { ok: false, error: "USER_REDEMPTION_LIMIT_REACHED" };
    logDiscountError("redemption", caught);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function scholarshipDiscountCodeExists(rawCode: string): Promise<
  { ok: true; exists: boolean } | { ok: false; error: "SERVER_ERROR" }
> {
  try {
    return { ok: true, exists: Boolean(await getDiscountByCode(rawCode)) };
  } catch (caught) {
    logDiscountError("scholarship code uniqueness check", caught);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

function scholarshipRecordMatches(
  record: DirectusDiscountCode,
  input: { userId: string; awardPercentage: number; currency: string }
) {
  return (
    normalizeReservedUserId(record.reserved_for_user) === input.userId &&
    record.discount_type === "percentage" &&
    Number(record.discount_value) === input.awardPercentage &&
    record.currency?.trim().toUpperCase() === input.currency &&
    record.applies_to === "training" &&
    record.is_active === true &&
    record.stackable === false &&
    Number(record.max_redemptions) === 1 &&
    Number(record.max_redemptions_per_user) === 1
  );
}

async function ensureScholarshipDiscountLocked(input: {
  code: string;
  userId: string;
  awardPercentage: number;
  currency: string;
}): Promise<
  | { ok: true; data: { code: string; created: boolean } }
  | { ok: false; error: ScholarshipDiscountSyncError }
> {
  let existing: DirectusDiscountCode | null;
  try {
    existing = await getDiscountByCode(input.code);
  } catch (caught) {
    logDirectusDiagnostic("scholarship-discount.lookup-code", caught);
    return { ok: false, error: "SERVER_ERROR" };
  }

  if (existing) {
    try {
      if (scholarshipRecordMatches(existing, input)) {
        return { ok: true, data: { code: input.code, created: false } };
      }
      logDirectusDiagnostic(
        "scholarship-discount.validate-reserved-for-user",
        new Error("Existing scholarship discount does not match its trusted attempt values")
      );
      return { ok: false, error: "CONFLICT" };
    } catch (caught) {
      logDirectusDiagnostic("scholarship-discount.validate-reserved-for-user", caught);
      return { ok: false, error: "CONFLICT" };
    }
  }

  try {
    const context = await requestContext();
    if (!context) return { ok: false, error: "SERVER_ERROR" };
    await context.client.request(
      withToken(
        context.token,
        createItem("discount_codes", {
          code: input.code,
          title: `Scholarship Award - ${input.awardPercentage}%`,
          description: "Scholarship discount awarded after qualifying in the scholarship exam.",
          discount_type: "percentage",
          discount_value: input.awardPercentage,
          currency: input.currency,
          starts_at: new Date().toISOString(),
          // No scholarship expiry rule exists in the current project configuration.
          expires_at: null,
          max_redemptions: 1,
          max_redemptions_per_user: 1,
          applies_to: "training",
          is_active: true,
          stackable: false,
          reserved_for_user: input.userId
        })
      )
    );
    return { ok: true, data: { code: input.code, created: true } };
  } catch (caught) {
    if (isConflict(caught)) {
      try {
        const raced = await getDiscountByCode(input.code);
        if (raced && scholarshipRecordMatches(raced, input)) {
          return { ok: true, data: { code: input.code, created: false } };
        }
        return { ok: false, error: "COLLISION" };
      } catch (readError) {
        logDirectusDiagnostic("scholarship-discount.lookup-after-conflict", readError);
        return { ok: false, error: "SERVER_ERROR" };
      }
    }
    logDirectusDiagnostic("scholarship-discount.create-code", caught);
    return { ok: false, error: "SERVER_ERROR" };
  }
}

export async function ensureScholarshipDiscountCode(input: {
  code: string;
  userId: string;
  awardPercentage: number;
  currency: string;
}) {
  let code: string;
  let awardPercentage: number;
  let currency: string;
  try {
    code = normalizeDiscountCode(input.code);
    awardPercentage = Number(input.awardPercentage);
    currency = input.currency.trim().toUpperCase();
  } catch (caught) {
    logDirectusDiagnostic("scholarship-discount.normalize-input", caught);
    return { ok: false, error: "SERVER_ERROR" } as const;
  }
  if (!code || code.length > 128) return { ok: false, error: "INVALID_CODE" } as const;
  if (!Number.isFinite(awardPercentage) || awardPercentage <= 0 || awardPercentage > 100) {
    return { ok: false, error: "INVALID_AWARD" } as const;
  }
  if (!/^[A-Z]{3}$/.test(currency)) return { ok: false, error: "INVALID_CURRENCY" } as const;

  const lockKey = code;
  const previous = scholarshipCodeLocks.get(lockKey) ?? Promise.resolve();
  let release = () => {};
  const current = new Promise<void>((resolve) => (release = resolve));
  scholarshipCodeLocks.set(lockKey, current);
  await previous;
  try {
    return await ensureScholarshipDiscountLocked({
      ...input,
      code,
      awardPercentage,
      currency
    });
  } finally {
    release();
    if (scholarshipCodeLocks.get(lockKey) === current) scholarshipCodeLocks.delete(lockKey);
  }
}

export async function redeemDiscountCode(userId: string, rawCode: string) {
  const normalizedCode = normalizeDiscountCode(rawCode);
  if (!normalizedCode) return { ok: false, error: "INVALID_CODE" } as const;

  const lockKey = `${userId}:${normalizedCode}`;
  const previous = redemptionLocks.get(lockKey) ?? Promise.resolve();
  let release = () => {};
  const current = new Promise<void>((resolve) => (release = resolve));
  redemptionLocks.set(lockKey, current);
  await previous;

  try {
    return await redeemLocked(userId, normalizedCode);
  } finally {
    release();
    if (redemptionLocks.get(lockKey) === current) redemptionLocks.delete(lockKey);
  }
}

export async function getUserDiscountRedemptions(userId: string) {
  noStore();
  const context = await requestContext();
  if (!context) throw new Error("Discount service is not configured");
  return context.client.request(
    withToken(
      context.token,
      readItems("discount_redemptions", {
        fields: accountRedemptionFields,
        filter: { user: { _eq: userId } },
        sort: ["-date_created"]
      })
    )
  );
}

export async function getCurrentUserDiscounts(userId: string): Promise<
  { ok: true; data: AccountDiscount[] } | { ok: false; error: "SERVER_ERROR" }
> {
  try {
    const records = await getUserDiscountRedemptions(userId);
    const now = Date.now();
    const data = records.flatMap((record) => {
      const discount = record.discount_code;
      if (!discount || typeof discount === "string") return [];
      const numericValue = Number(discount.discount_value);
      if (!Number.isFinite(numericValue)) return [];
      const expiresAt = discount.expires_at ? Date.parse(discount.expires_at) : null;
      const displayStatus: AccountDiscount["displayStatus"] =
        record.status === "available" && expiresAt !== null && Number.isFinite(expiresAt) && expiresAt <= now
          ? "expired"
          : record.status;
      return [{
        id: record.id,
        code: discount.code,
        title: discount.title,
        description: discount.description,
        discountType: discount.discount_type,
        discountValue: numericValue,
        currency: discount.currency?.trim() || record.currency?.trim() || "TRY",
        appliesTo: discount.applies_to,
        expiresAt: discount.expires_at,
        status: record.status,
        displayStatus
      }];
    });
    return { ok: true, data };
  } catch (caught) {
    logDiscountError("current user list", caught);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
