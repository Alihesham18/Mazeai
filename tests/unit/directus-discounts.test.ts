import { beforeEach, describe, expect, it, vi } from "vitest";

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));
vi.mock("@directus/sdk", () => ({
  createItem: (collection: string, item: unknown, query: unknown) => ({
    operation: "create", collection, item, query
  }),
  readItems: (collection: string, query: unknown) => ({ operation: "read", collection, query }),
  withToken: (_token: string, command: unknown) => command,
  isDirectusError: (error: unknown) => Boolean(error && typeof error === "object" && "errors" in error)
}));
vi.mock("@/lib/directus/client", () => ({ createDirectusRestClient: () => ({ request }) }));

import {
  ensureScholarshipDiscountCode,
  getCurrentUserDiscounts,
  normalizeDiscountCode,
  normalizeReservedUserId,
  redeemDiscountCode
} from "@/lib/directus/discounts";
import type { DirectusDiscountCode } from "@/lib/directus/types";

const baseCode: DirectusDiscountCode = {
  id: "discount-uuid",
  code: "TEST20",
  title: "Test discount",
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
  stackable: false,
  reserved_for_user: null
};

function successfulRequests(code = baseCode) {
  request
    .mockResolvedValueOnce([code])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce({ id: "redemption-uuid" });
}

describe("Directus discount redemption", () => {
  beforeEach(() => {
    process.env.DIRECTUS_DISCOUNT_SERVICE_TOKEN = "discount-service-token";
    request.mockReset();
  });

  it("normalizes whitespace and casing", () => {
    expect(normalizeDiscountCode(" test20 ")).toBe("TEST20");
  });

  it("normalizes reserved_for_user without requiring nested user fields", () => {
    expect(normalizeReservedUserId(" directus-user-uuid ")).toBe("directus-user-uuid");
    expect(
      normalizeReservedUserId({ id: "related-user-uuid" } as DirectusDiscountCode["reserved_for_user"])
    ).toBe("related-user-uuid");
    expect(normalizeReservedUserId(null)).toBeNull();
  });

  it("creates an available redemption with trusted relations and no usage fields", async () => {
    successfulRequests();

    await expect(redeemDiscountCode("directus-user-uuid", " test20 ")).resolves.toEqual({
      ok: true,
      redemptionId: "redemption-uuid"
    });
    expect(request.mock.calls[0][0].query.filter.code._eq).toBe("TEST20");
    const create = request.mock.calls[5][0];
    expect(create).toMatchObject({
      operation: "create",
      collection: "discount_redemptions",
      item: {
        user: "directus-user-uuid",
        discount_code: "discount-uuid",
        status: "available",
        currency: "TRY"
      }
    });
    expect(create.item).not.toHaveProperty("used_at");
    expect(create.item).not.toHaveProperty("used_for_type");
    expect(create.item).not.toHaveProperty("original_amount");
    expect(create.item).not.toHaveProperty("discount_amount");
    expect(create.item).not.toHaveProperty("final_amount");
  });

  it("allows the reserved scholarship owner to redeem their code", async () => {
    successfulRequests({ ...baseCode, reserved_for_user: "directus-user-uuid" });

    await expect(redeemDiscountCode("directus-user-uuid", "TEST20")).resolves.toEqual({
      ok: true,
      redemptionId: "redemption-uuid"
    });
  });

  it("rejects a scholarship code reserved for another user before creating a redemption", async () => {
    request.mockResolvedValueOnce([{ ...baseCode, reserved_for_user: "another-user" }]);

    await expect(redeemDiscountCode("directus-user-uuid", "TEST20")).resolves.toEqual({
      ok: false,
      error: "SCHOLARSHIP_CODE_NOT_OWNED"
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("creates an owner-reserved, single-use training discount for a scholarship", async () => {
    request.mockResolvedValueOnce([]).mockResolvedValueOnce({ id: "scholarship-discount" });

    await expect(
      ensureScholarshipDiscountCode({
        code: " synergy-abc234 ",
        userId: "directus-user-uuid",
        awardPercentage: 40,
        currency: "try"
      })
    ).resolves.toEqual({
      ok: true,
      data: { code: "SYNERGY-ABC234", created: true }
    });
    const create = request.mock.calls[1][0];
    expect(create).toMatchObject({
      operation: "create",
      collection: "discount_codes",
      item: {
        code: "SYNERGY-ABC234",
        discount_type: "percentage",
        discount_value: 40,
        currency: "TRY",
        expires_at: null,
        max_redemptions: 1,
        max_redemptions_per_user: 1,
        applies_to: "training",
        is_active: true,
        stackable: false,
        reserved_for_user: "directus-user-uuid"
      }
    });
    expect(Date.parse(create.item.starts_at)).not.toBeNaN();
  });

  it("reuses a matching scholarship discount instead of creating a duplicate", async () => {
    request.mockResolvedValueOnce([
      {
        ...baseCode,
        code: "SYNERGY-ABC234",
        discount_value: 40,
        max_redemptions: 1,
        reserved_for_user: "directus-user-uuid"
      }
    ]);

    await expect(
      ensureScholarshipDiscountCode({
        code: "SYNERGY-ABC234",
        userId: "directus-user-uuid",
        awardPercentage: 40,
        currency: "TRY"
      })
    ).resolves.toEqual({
      ok: true,
      data: { code: "SYNERGY-ABC234", created: false }
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("creates only once when synchronization is repeated for the same stored attempt code", async () => {
    const scholarshipCode = {
      ...baseCode,
      code: "SYNERGY-ABC234",
      discount_value: 40,
      max_redemptions: 1,
      reserved_for_user: "directus-user-uuid"
    };
    request
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ id: "scholarship-discount" })
      .mockResolvedValueOnce([scholarshipCode]);
    const input = {
      code: "SYNERGY-ABC234",
      userId: "directus-user-uuid",
      awardPercentage: 40,
      currency: "TRY"
    };

    await expect(ensureScholarshipDiscountCode(input)).resolves.toMatchObject({
      ok: true,
      data: { created: true }
    });
    await expect(ensureScholarshipDiscountCode(input)).resolves.toMatchObject({
      ok: true,
      data: { created: false }
    });
    expect(
      request.mock.calls.filter(([command]) => command.operation === "create")
    ).toHaveLength(1);
  });

  it("does not claim a conflicting scholarship code owned by another user", async () => {
    request.mockResolvedValueOnce([
      {
        ...baseCode,
        code: "SYNERGY-ABC234",
        discount_value: 40,
        max_redemptions: 1,
        reserved_for_user: "another-user"
      }
    ]);

    await expect(
      ensureScholarshipDiscountCode({
        code: "SYNERGY-ABC234",
        userId: "directus-user-uuid",
        awardPercentage: 40,
        currency: "TRY"
      })
    ).resolves.toEqual({ ok: false, error: "CONFLICT" });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("rejects a nonexistent code", async () => {
    request.mockResolvedValueOnce([]);
    await expect(redeemDiscountCode("user", "missing")).resolves.toEqual({
      ok: false, error: "INVALID_CODE"
    });
  });

  it("rejects an inactive code", async () => {
    request.mockResolvedValueOnce([{ ...baseCode, is_active: false }]);
    await expect(redeemDiscountCode("user", "TEST20")).resolves.toEqual({
      ok: false, error: "CODE_INACTIVE"
    });
  });

  it("rejects a code whose start date is in the future", async () => {
    request.mockResolvedValueOnce([{ ...baseCode, starts_at: "2999-01-01T00:00:00Z" }]);
    await expect(redeemDiscountCode("user", "TEST20")).resolves.toEqual({
      ok: false, error: "CODE_NOT_STARTED"
    });
  });

  it("rejects an expired code", async () => {
    request.mockResolvedValueOnce([{ ...baseCode, expires_at: "2000-01-01T00:00:00Z" }]);
    await expect(redeemDiscountCode("user", "TEST20")).resolves.toEqual({
      ok: false, error: "CODE_EXPIRED"
    });
  });

  it("fails when the global redemption limit is reached", async () => {
    request
      .mockResolvedValueOnce([{ ...baseCode, max_redemptions: 1 }])
      .mockResolvedValueOnce([{ id: "existing" }])
      .mockResolvedValueOnce([]);
    await expect(redeemDiscountCode("user", "TEST20")).resolves.toEqual({
      ok: false, error: "REDEMPTION_LIMIT_REACHED"
    });
  });

  it("fails when the authenticated user's limit is reached", async () => {
    request
      .mockResolvedValueOnce([baseCode])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "existing" }]);
    await expect(redeemDiscountCode("user", "TEST20")).resolves.toEqual({
      ok: false, error: "USER_REDEMPTION_LIMIT_REACHED"
    });
  });

  it("reads only the requested user's records and derives display statuses", async () => {
    request.mockResolvedValueOnce([
      { id: "expired", status: "available", currency: "TRY", discount_code: { ...baseCode, expires_at: "2000-01-01T00:00:00Z" } },
      { id: "used", status: "used", currency: "TRY", discount_code: baseCode },
      { id: "revoked", status: "revoked", currency: "TRY", discount_code: baseCode }
    ]);
    const result = await getCurrentUserDiscounts("current-user-uuid");
    expect(request.mock.calls[0][0].query.filter).toEqual({ user: { _eq: "current-user-uuid" } });
    expect(result.ok && result.data.map((item) => item.displayStatus)).toEqual([
      "expired", "used", "revoked"
    ]);
  });
});
