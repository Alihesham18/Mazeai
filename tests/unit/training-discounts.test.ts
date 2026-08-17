import { beforeEach, describe, expect, it, vi } from "vitest";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));
vi.mock("@directus/sdk", () => ({
  readItems: (collection: string, query: unknown) => ({ operation: "read", collection, query }),
  updateItems: (collection: string, query: unknown, item: unknown, resultQuery: unknown) => ({
    operation: "update",
    collection,
    query,
    item,
    resultQuery
  }),
  withToken: (_token: string, command: unknown) => command,
  isDirectusError: (error: unknown) => Boolean(error && typeof error === "object" && "errors" in error)
}));
vi.mock("@/lib/directus/client", () => ({
  createDirectusRestClient: () => ({ request })
}));

import {
  applyTrainingDiscount,
  calculateTrainingDiscount,
  quoteTrainingDiscount
} from "@/lib/directus/training-discounts";
import type {
  DirectusDiscountCode,
  DirectusDiscountRedemption
} from "@/lib/directus/types";

const program = {
  id: "program-uuid",
  title: "Data Science",
  fee: "90000.00",
  currency: "TRY"
};

const application = {
  id: "application-uuid",
  user: "current-user-uuid",
  status: "accepted",
  date_created: "2026-01-01T00:00:00Z",
  training_program: program
};

const code: DirectusDiscountCode = {
  id: "code-uuid",
  code: "TEST20",
  title: "Test 20",
  description: null,
  discount_type: "percentage",
  discount_value: 20,
  currency: "TRY",
  starts_at: null,
  expires_at: null,
  max_redemptions: 100,
  max_redemptions_per_user: 1,
  applies_to: "training",
  is_active: true,
  stackable: false
};

const redemption: DirectusDiscountRedemption = {
  id: "redemption-uuid",
  user: "current-user-uuid",
  discount_code: code,
  status: "available",
  used_at: null,
  used_for_type: null,
  used_for_id: null,
  original_amount: null,
  discount_amount: null,
  final_amount: null,
  currency: "TRY"
};

const input = {
  accessToken: "authenticated-session-token",
  userId: "current-user-uuid",
  applicationId: "application-uuid",
  redemptionId: "redemption-uuid"
};

function arrange(options: {
  application?: typeof application | null;
  redemption?: typeof redemption | null;
  applied?: typeof redemption | null;
} = {}) {
  const selectedApplication = options.application === undefined ? application : options.application;
  const selectedRedemption = options.redemption === undefined ? redemption : options.redemption;
  const selectedApplied = options.applied === undefined ? null : options.applied;
  request.mockImplementation(async (command) => {
    if (command.operation === "update") return [{ id: "redemption-uuid", status: "used" }];
    if (command.collection === "training_applications") {
      return selectedApplication ? [selectedApplication] : [];
    }
    if (command.query.filter.used_for_id) return selectedApplied ? [selectedApplied] : [];
    return selectedRedemption ? [selectedRedemption] : [];
  });
}

describe("training discount money calculation", () => {
  it("calculates a percentage discount with currency-safe minor units", () => {
    expect(calculateTrainingDiscount({
      originalAmount: "90000.00",
      discountType: "percentage",
      discountValue: "20",
      currency: "TRY"
    })).toEqual({
      ok: true,
      data: {
        originalAmount: "90000.00",
        discountAmount: "18000.00",
        finalAmount: "72000.00"
      }
    });
  });

  it("calculates a fixed discount", () => {
    expect(calculateTrainingDiscount({
      originalAmount: "90000.00",
      discountType: "fixed",
      discountValue: "500.00",
      currency: "TRY"
    })).toMatchObject({
      ok: true,
      data: { discountAmount: "500.00", finalAmount: "89500.00" }
    });
  });

  it("caps a fixed discount so the final amount cannot become negative", () => {
    expect(calculateTrainingDiscount({
      originalAmount: "100.00",
      discountType: "fixed",
      discountValue: "500.00",
      currency: "TRY"
    })).toEqual({
      ok: true,
      data: { originalAmount: "100.00", discountAmount: "100.00", finalAmount: "0.00" }
    });
  });
});

describe("training discount validation and persistence", () => {
  beforeEach(() => {
    process.env.DIRECTUS_DISCOUNT_SERVICE_TOKEN = "server-only-discount-token";
    request.mockReset();
  });

  it("loads an accepted training fee and returns a quote without consuming the redemption", async () => {
    arrange();
    const result = await quoteTrainingDiscount(input);

    expect(result).toMatchObject({
      ok: true,
      data: {
        originalAmount: "90000.00",
        discountAmount: "18000.00",
        finalAmount: "72000.00",
        currency: "TRY"
      }
    });
    expect(request.mock.calls[0][0].query.filter).toEqual({
      id: { _eq: "application-uuid" },
      user: { _eq: "current-user-uuid" }
    });
    expect(request.mock.calls[1][0].query.filter).toEqual({
      id: { _eq: "redemption-uuid" },
      user: { _eq: "current-user-uuid" }
    });
    expect(request.mock.calls.some(([command]) => command.operation === "update")).toBe(false);
  });

  it.each(["submitted", "under_review", "rejected"])(
    "rejects a %s training application",
    async (status) => {
      arrange({ application: { ...application, status } });
      await expect(quoteTrainingDiscount(input)).resolves.toEqual({
        ok: false,
        error: "TRAINING_NOT_ACCEPTED"
      });
    }
  );

  it("rejects a currency mismatch", async () => {
    arrange({ redemption: { ...redemption, discount_code: { ...code, currency: "USD" } } });
    await expect(quoteTrainingDiscount(input)).resolves.toEqual({
      ok: false,
      error: "CURRENCY_MISMATCH"
    });
  });

  it.each(["training", "all"] as const)("accepts applies_to=%s", async (appliesTo) => {
    arrange({ redemption: { ...redemption, discount_code: { ...code, applies_to: appliesTo } } });
    expect((await quoteTrainingDiscount(input)).ok).toBe(true);
  });

  it("rejects an event-only discount", async () => {
    arrange({ redemption: { ...redemption, discount_code: { ...code, applies_to: "event" } } });
    await expect(quoteTrainingDiscount(input)).resolves.toEqual({
      ok: false,
      error: "APPLIES_TO_MISMATCH"
    });
  });

  it("rejects an expired discount", async () => {
    arrange({
      redemption: {
        ...redemption,
        discount_code: { ...code, expires_at: "2000-01-01T00:00:00Z" }
      }
    });
    await expect(quoteTrainingDiscount(input)).resolves.toEqual({ ok: false, error: "CODE_EXPIRED" });
  });

  it("rejects an inactive discount", async () => {
    arrange({ redemption: { ...redemption, discount_code: { ...code, is_active: false } } });
    await expect(quoteTrainingDiscount(input)).resolves.toEqual({ ok: false, error: "CODE_INACTIVE" });
  });

  it.each([
    ["used", "DISCOUNT_USED"],
    ["revoked", "DISCOUNT_REVOKED"]
  ] as const)("rejects a %s redemption", async (status, error) => {
    arrange({ redemption: { ...redemption, status } });
    await expect(quoteTrainingDiscount(input)).resolves.toEqual({ ok: false, error });
  });

  it("rejects a redemption that is not owned by the current user", async () => {
    arrange({ redemption: null });
    await expect(quoteTrainingDiscount(input)).resolves.toEqual({
      ok: false,
      error: "REDEMPTION_NOT_FOUND"
    });
  });

  it("prevents another discount when the training is already discounted", async () => {
    arrange({
      applied: {
        ...redemption,
        id: "existing-used-redemption",
        status: "used",
        used_for_type: "training",
        used_for_id: "application-uuid"
      }
    });
    await expect(quoteTrainingDiscount(input)).resolves.toEqual({
      ok: false,
      error: "ALREADY_DISCOUNTED"
    });
  });

  it("atomically changes available to used and saves all trusted amount fields", async () => {
    arrange();
    const result = await applyTrainingDiscount(input);

    expect(result.ok).toBe(true);
    const update = request.mock.calls.map(([command]) => command).find((command) => command.operation === "update");
    expect(update.query.filter).toEqual({
      id: { _eq: "redemption-uuid" },
      user: { _eq: "current-user-uuid" },
      status: { _eq: "available" }
    });
    expect(update.item).toMatchObject({
      status: "used",
      used_for_type: "training",
      used_for_id: "application-uuid",
      original_amount: "90000.00",
      discount_amount: "18000.00",
      final_amount: "72000.00",
      currency: "TRY"
    });
    expect(update.item.used_at).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(update.item.used_at))).toBe(false);
  });
});
