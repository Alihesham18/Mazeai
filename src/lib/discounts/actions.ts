"use server";

import { revalidatePath } from "next/cache";
import { isLocale, type Locale } from "@/i18n/routing";
import { getCurrentDirectusUser } from "@/lib/directus/auth";
import {
  redeemDiscountCode,
  type DiscountRedemptionError
} from "@/lib/directus/discounts";

export type DiscountActionMessage = DiscountRedemptionError | "UNAUTHENTICATED";
export interface DiscountActionState {
  status: "idle" | "error" | "success";
  message?: DiscountActionMessage | "REDEMPTION_SUCCESS";
}

export const initialDiscountActionState: DiscountActionState = { status: "idle" };

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function redeemDiscountAction(
  localeValue: string,
  _previousState: DiscountActionState,
  formData: FormData
): Promise<DiscountActionState> {
  const locale: Locale = isLocale(localeValue) ? localeValue : "en";
  const code = formValue(formData, "code");
  if (!code.trim() || code.length > 128) return { status: "error", message: "INVALID_CODE" };

  const user = await getCurrentDirectusUser();
  if (!user) return { status: "error", message: "UNAUTHENTICATED" };

  const result = await redeemDiscountCode(user.id, code);
  if (!result.ok) return { status: "error", message: result.error };

  revalidatePath(`/${locale}/account/profile`);
  return { status: "success", message: "REDEMPTION_SUCCESS" };
}
