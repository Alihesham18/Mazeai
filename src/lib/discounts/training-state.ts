import type { TrainingDiscountQuote } from "@/lib/directus/training-discounts";

export type TrainingDiscountMessage =
  | "CURRENCY_MISMATCH"
  | "DISCOUNT_UNAVAILABLE"
  | "ALREADY_DISCOUNTED"
  | "QUOTE_FAILED"
  | "APPLY_FAILED"
  | "DISCOUNT_APPLIED";

export interface TrainingDiscountActionState {
  status: "idle" | "error" | "quoted" | "applied";
  message?: TrainingDiscountMessage;
  quote?: TrainingDiscountQuote;
}

export const initialTrainingDiscountState: TrainingDiscountActionState = { status: "idle" };
