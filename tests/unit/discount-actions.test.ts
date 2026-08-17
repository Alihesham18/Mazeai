import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser, redeem, revalidatePath } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(), redeem: vi.fn(), revalidatePath: vi.fn()
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/directus/auth", () => ({ getCurrentDirectusUser: getCurrentUser }));
vi.mock("@/lib/directus/discounts", () => ({ redeemDiscountCode: redeem }));

import { initialDiscountActionState, redeemDiscountAction } from "@/lib/discounts/actions";

describe("discount redemption action security", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    redeem.mockReset();
    revalidatePath.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    getCurrentUser.mockResolvedValueOnce(null);
    const data = new FormData();
    data.set("code", "TEST20");
    await expect(redeemDiscountAction("en", initialDiscountActionState, data)).resolves.toEqual({
      status: "error", message: "UNAUTHENTICATED"
    });
    expect(redeem).not.toHaveBeenCalled();
  });

  it("uses the session user UUID and ignores browser ownership fields", async () => {
    getCurrentUser.mockResolvedValueOnce({ id: "session-user-uuid" });
    redeem.mockResolvedValueOnce({ ok: true, redemptionId: "redemption" });
    const data = new FormData();
    data.set("code", " test20 ");
    data.set("userId", "attacker-user-uuid");
    data.set("account_number", "SMA-2026-789191");
    data.set("status", "used");

    await expect(redeemDiscountAction("tr", initialDiscountActionState, data)).resolves.toEqual({
      status: "success", message: "REDEMPTION_SUCCESS"
    });
    expect(redeem).toHaveBeenCalledWith("session-user-uuid", " test20 ");
    expect(revalidatePath).toHaveBeenCalledWith("/tr/account/profile");
  });
});
