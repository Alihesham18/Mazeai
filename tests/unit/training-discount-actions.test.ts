import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentUser, session, quote, apply, revalidatePath } = vi.hoisted(() => ({
  currentUser: vi.fn(),
  session: vi.fn(),
  quote: vi.fn(),
  apply: vi.fn(),
  revalidatePath: vi.fn()
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/directus/auth", () => ({
  getCurrentDirectusUser: currentUser,
  getAuthenticatedDirectusSession: session
}));
vi.mock("@/lib/directus/training-discounts", () => ({
  quoteTrainingDiscount: quote,
  applyTrainingDiscount: apply
}));

import {
  applyTrainingDiscountAction,
  quoteTrainingDiscountAction
} from "@/lib/discounts/training-actions";
import { initialTrainingDiscountState } from "@/lib/discounts/training-state";

function form() {
  const data = new FormData();
  data.set("applicationId", "application-uuid");
  data.set("redemptionId", "redemption-uuid");
  data.set("userId", "attacker-user-uuid");
  data.set("originalAmount", "1");
  data.set("discountAmount", "999999");
  data.set("currency", "USD");
  return data;
}

describe("training discount server actions", () => {
  beforeEach(() => {
    currentUser.mockReset().mockResolvedValue({ id: "authenticated-user-uuid" });
    session.mockReset().mockResolvedValue({ accessToken: "session-token" });
    quote.mockReset();
    apply.mockReset();
    revalidatePath.mockReset();
  });

  it("exports only async actions from the use-server module", async () => {
    const actions = await import("@/lib/discounts/training-actions");
    expect(Object.keys(actions).sort()).toEqual([
      "applyTrainingDiscountAction",
      "quoteTrainingDiscountAction"
    ]);
    expect(actions.applyTrainingDiscountAction.constructor.name).toBe("AsyncFunction");
    expect(actions.quoteTrainingDiscountAction.constructor.name).toBe("AsyncFunction");
  });

  it("derives ownership and all trusted pricing context on the server", async () => {
    quote.mockResolvedValue({
      ok: true,
      data: {
        applicationId: "application-uuid",
        redemptionId: "redemption-uuid",
        originalAmount: "90000.00",
        discountAmount: "18000.00",
        finalAmount: "72000.00",
        currency: "TRY"
      }
    });

    await quoteTrainingDiscountAction("en", initialTrainingDiscountState, form());

    expect(quote).toHaveBeenCalledWith({
      accessToken: "session-token",
      userId: "authenticated-user-uuid",
      applicationId: "application-uuid",
      redemptionId: "redemption-uuid"
    });
  });

  it("revalidates My Trainings and discount history after applying", async () => {
    apply.mockResolvedValue({
      ok: true,
      data: {
        applicationId: "application-uuid",
        redemptionId: "redemption-uuid",
        originalAmount: "90000.00",
        discountAmount: "18000.00",
        finalAmount: "72000.00",
        currency: "TRY"
      }
    });

    await expect(
      applyTrainingDiscountAction("tr", initialTrainingDiscountState, form())
    ).resolves.toMatchObject({ status: "applied", message: "DISCOUNT_APPLIED" });
    expect(revalidatePath).toHaveBeenCalledWith("/tr/account/my-trainings");
    expect(revalidatePath).toHaveBeenCalledWith("/tr/account/profile");
  });
});
