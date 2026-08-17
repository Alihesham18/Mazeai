"use server";

import { revalidatePath } from "next/cache";
import { isLocale, type Locale } from "@/i18n/routing";
import { getAuthenticatedDirectusSession, getCurrentDirectusUser } from "@/lib/directus/auth";
import {
  applyTrainingDiscount,
  quoteTrainingDiscount,
  type TrainingDiscountError
} from "@/lib/directus/training-discounts";
import type {
  TrainingDiscountActionState,
  TrainingDiscountMessage
} from "./training-state";

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

function identifiers(formData: FormData) {
  const applicationId = value(formData, "applicationId");
  const redemptionId = value(formData, "redemptionId");
  if (!applicationId || !redemptionId || applicationId.length > 128 || redemptionId.length > 128) {
    return null;
  }
  return { applicationId, redemptionId };
}

async function authenticatedContext() {
  const user = await getCurrentDirectusUser();
  const session = user ? await getAuthenticatedDirectusSession() : null;
  return user && session ? { userId: user.id, accessToken: session.accessToken } : null;
}

function safeMessage(error: TrainingDiscountError, operation: "quote" | "apply"):
  TrainingDiscountMessage {
  if (error === "CURRENCY_MISMATCH") return "CURRENCY_MISMATCH";
  if (error === "ALREADY_DISCOUNTED") return "ALREADY_DISCOUNTED";
  if (
    error === "REDEMPTION_NOT_FOUND" ||
    error === "DISCOUNT_UNAVAILABLE" ||
    error === "DISCOUNT_USED" ||
    error === "DISCOUNT_REVOKED" ||
    error === "CODE_INACTIVE" ||
    error === "CODE_NOT_STARTED" ||
    error === "CODE_EXPIRED" ||
    error === "APPLIES_TO_MISMATCH"
  ) {
    return "DISCOUNT_UNAVAILABLE";
  }
  return operation === "quote" ? "QUOTE_FAILED" : "APPLY_FAILED";
}

export async function quoteTrainingDiscountAction(
  _localeValue: string,
  _previousState: TrainingDiscountActionState,
  formData: FormData
): Promise<TrainingDiscountActionState> {
  const selected = identifiers(formData);
  if (!selected) return { status: "error", message: "QUOTE_FAILED" };
  const auth = await authenticatedContext();
  if (!auth) return { status: "error", message: "QUOTE_FAILED" };
  const result = await quoteTrainingDiscount({ ...auth, ...selected });
  return result.ok
    ? { status: "quoted", quote: result.data }
    : { status: "error", message: safeMessage(result.error, "quote") };
}

export async function applyTrainingDiscountAction(
  localeValue: string,
  _previousState: TrainingDiscountActionState,
  formData: FormData
): Promise<TrainingDiscountActionState> {
  const locale: Locale = isLocale(localeValue) ? localeValue : "en";
  const selected = identifiers(formData);
  if (!selected) return { status: "error", message: "APPLY_FAILED" };
  const auth = await authenticatedContext();
  if (!auth) return { status: "error", message: "APPLY_FAILED" };
  const result = await applyTrainingDiscount({ ...auth, ...selected });
  if (!result.ok) return { status: "error", message: safeMessage(result.error, "apply") };

  revalidatePath(`/${locale}/account/my-trainings`);
  revalidatePath(`/${locale}/account/profile`);
  return { status: "applied", message: "DISCOUNT_APPLIED", quote: result.data };
}
