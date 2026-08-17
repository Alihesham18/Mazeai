import type { DiscountRedemptionError } from "@/lib/directus/discounts";

export type DiscountActionMessage = DiscountRedemptionError | "UNAUTHENTICATED";

export interface DiscountActionState {
  status: "idle" | "error" | "success";
  message?: DiscountActionMessage | "REDEMPTION_SUCCESS";
}

export const initialDiscountActionState: DiscountActionState = { status: "idle" };
