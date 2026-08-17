import { beforeEach, describe, expect, it, vi } from "vitest";

const { request, codeExists, ensureDiscount } = vi.hoisted(() => ({
  request: vi.fn(),
  codeExists: vi.fn(),
  ensureDiscount: vi.fn()
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_noStore: vi.fn() }));
vi.mock("@directus/sdk", () => ({
  createItem: (collection: string, item: unknown) => ({ operation: "create", collection, item }),
  readItems: (collection: string, query: unknown) => ({ operation: "read", collection, query }),
  withToken: (token: string, command: unknown) => ({ token, command }),
  isDirectusError: (error: unknown) =>
    typeof error === "object" && error !== null && "errors" in error
}));
vi.mock("@/lib/directus/client", () => ({
  createDirectusRestClient: () => ({ request })
}));
vi.mock("@/lib/directus/auth", () => ({
  directusAuthErrorCode: vi.fn(() => "serverFailure"),
  getAuthenticatedDirectusSession: vi.fn(async () => ({ accessToken: "user-token" })),
  getCurrentDirectusUser: vi.fn(async () => ({ id: "user-1" }))
}));
vi.mock("@/lib/directus/discounts", () => ({
  scholarshipDiscountCodeExists: codeExists,
  ensureScholarshipDiscountCode: ensureDiscount
}));

import {
  createTrustedScholarshipAttempt,
  getActiveScholarshipRules,
  getCurrentUserScholarshipAttempts
} from "@/lib/directus/scholarship";

const input = {
  userId: "user-1",
  programId: "program-1",
  score: 9,
  totalQuestions: 10,
  percentage: 90,
  scholarshipPercentage: 40,
  status: "eligible" as const,
  currency: "TRY"
};

describe("Directus scholarship service", () => {
  beforeEach(() => {
    request.mockReset();
    codeExists.mockReset().mockResolvedValue({ ok: true, exists: false });
    ensureDiscount.mockReset().mockResolvedValue({
      ok: true,
      data: { code: "SYNERGY-ABC234", created: true }
    });
    process.env.DIRECTUS_SCHOLARSHIP_TOKEN = "private-service-token";
  });

  it("uses the service token to read only active rules", async () => {
    request.mockResolvedValueOnce([]);

    await expect(getActiveScholarshipRules()).resolves.toEqual({ ok: true, data: [] });
    expect(request).toHaveBeenCalledWith({
      token: "private-service-token",
      command: expect.objectContaining({
        operation: "read",
        collection: "scholarship_rules",
        query: expect.objectContaining({ filter: { active: { _eq: true } } })
      })
    });
  });

  it("creates only trusted attempt fields", async () => {
    request.mockResolvedValueOnce({ id: "attempt-1", discount_code: "SYNERGY-ABC234" });

    await expect(
      createTrustedScholarshipAttempt(input, { codeFactory: () => "SYNERGY-ABC234" })
    ).resolves.toEqual({
      ok: true,
      data: {
        attemptId: "attempt-1",
        discountCode: "SYNERGY-ABC234",
        discountReady: true
      }
    });

    const item = request.mock.calls[0][0].command.item;
    expect(item).toEqual({
      user: "user-1",
      training_program: "program-1",
      score: 9,
      total_questions: 10,
      percentage: 90,
      scholarship_percentage: 40,
      discount_code: "SYNERGY-ABC234",
      status: "eligible"
    });
    expect(item).not.toHaveProperty("id");
    expect(item).not.toHaveProperty("date_created");
    expect(item).not.toHaveProperty("date_updated");
    expect(ensureDiscount).toHaveBeenCalledWith({
      code: "SYNERGY-ABC234",
      userId: "user-1",
      awardPercentage: 40,
      currency: "TRY"
    });
  });

  it("retries with a new code when Directus reports a unique collision", async () => {
    request
      .mockRejectedValueOnce({ errors: [{ message: "Value has to be unique" }] })
      .mockResolvedValueOnce({ id: "attempt-1", discount_code: "SYNERGY-SECOND" });
    const codes = ["SYNERGY-FIRST1", "SYNERGY-SECOND"];

    await expect(
      createTrustedScholarshipAttempt(input, { codeFactory: () => String(codes.shift()) })
    ).resolves.toEqual({
      ok: true,
      data: {
        attemptId: "attempt-1",
        discountCode: "SYNERGY-SECOND",
        discountReady: true
      }
    });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("does not create a discount for a non-eligible attempt", async () => {
    request.mockResolvedValueOnce({ id: "attempt-1", discount_code: null });

    await expect(
      createTrustedScholarshipAttempt({
        ...input,
        status: "not_eligible",
        scholarshipPercentage: null
      })
    ).resolves.toEqual({
      ok: true,
      data: { attemptId: "attempt-1", discountCode: null, discountReady: false }
    });
    expect(codeExists).not.toHaveBeenCalled();
    expect(ensureDiscount).not.toHaveBeenCalled();
  });

  it("backfills a historic eligible attempt using its exact stored code and current owner", async () => {
    request.mockResolvedValueOnce([
      {
        id: "historic-attempt",
        score: 9,
        total_questions: 10,
        percentage: 90,
        scholarship_percentage: 40,
        discount_code: "SYNERGY-HISTORY",
        status: "eligible",
        date_created: "2026-01-01T00:00:00Z",
        training_program: {
          id: "program-1",
          slug: "leadership",
          title: "Leadership",
          currency: "TRY"
        }
      }
    ]);

    await expect(getCurrentUserScholarshipAttempts()).resolves.toEqual({
      ok: true,
      data: [
        expect.objectContaining({
          id: "historic-attempt",
          discountCode: "SYNERGY-HISTORY",
          discountReady: true
        })
      ]
    });
    expect(ensureDiscount).toHaveBeenCalledWith({
      code: "SYNERGY-HISTORY",
      userId: "user-1",
      awardPercentage: 40,
      currency: "TRY"
    });
    expect(request.mock.calls[0][0].command.query).not.toHaveProperty("filter");
  });

  it("does not backfill a historic non-eligible attempt", async () => {
    request.mockResolvedValueOnce([
      {
        id: "historic-attempt",
        score: 4,
        total_questions: 10,
        percentage: 40,
        scholarship_percentage: null,
        discount_code: null,
        status: "not_eligible",
        date_created: "2026-01-01T00:00:00Z",
        training_program: {
          id: "program-1",
          slug: "leadership",
          title: "Leadership",
          currency: "TRY"
        }
      }
    ]);

    const result = await getCurrentUserScholarshipAttempts();
    expect(result.ok && result.data[0]).toMatchObject({
      discountCode: null,
      discountReady: false
    });
    expect(ensureDiscount).not.toHaveBeenCalled();
  });

  it("keeps scholarship history visible when discount synchronization throws", async () => {
    request.mockResolvedValueOnce([
      {
        id: "historic-attempt",
        score: 9,
        total_questions: 10,
        percentage: 90,
        scholarship_percentage: 40,
        discount_code: "SYNERGY-HISTORY",
        status: "eligible",
        date_created: "2026-01-01T00:00:00Z",
        training_program: {
          id: "program-1",
          slug: "leadership",
          title: "Leadership",
          currency: "TRY"
        }
      }
    ]);
    ensureDiscount.mockRejectedValueOnce(new TypeError("discount sync unavailable"));

    const result = await getCurrentUserScholarshipAttempts();

    expect(result).toEqual({
      ok: true,
      data: [
        expect.objectContaining({
          id: "historic-attempt",
          discountCode: "SYNERGY-HISTORY",
          discountReady: false,
          status: "eligible"
        })
      ]
    });
  });

  it("isolates a broken discount synchronization to its individual attempt", async () => {
    const attempt = {
      score: 9,
      total_questions: 10,
      percentage: 90,
      scholarship_percentage: 40,
      status: "eligible",
      date_created: "2026-01-01T00:00:00Z",
      training_program: {
        id: "program-1",
        slug: "leadership",
        title: "Leadership",
        currency: "TRY"
      }
    };
    request.mockResolvedValueOnce([
      { ...attempt, id: "broken", discount_code: "SYNERGY-BROKEN" },
      { ...attempt, id: "working", discount_code: "SYNERGY-WORKING" }
    ]);
    ensureDiscount
      .mockRejectedValueOnce(new TypeError("one attempt failed"))
      .mockResolvedValueOnce({ ok: true, data: { code: "SYNERGY-WORKING", created: false } });

    const result = await getCurrentUserScholarshipAttempts();

    expect(result.ok && result.data).toEqual([
      expect.objectContaining({ id: "broken", discountReady: false }),
      expect.objectContaining({ id: "working", discountReady: true })
    ]);
  });

  it("returns a page-level failure only when scholarship history itself cannot be read", async () => {
    const diagnostic = vi.spyOn(console, "error").mockImplementation(() => {});
    request.mockRejectedValueOnce({
      name: "RequestError",
      errors: [{ message: "History unavailable", extensions: { code: "SERVICE_UNAVAILABLE" } }],
      response: { status: 503 }
    });

    await expect(getCurrentUserScholarshipAttempts()).resolves.toEqual({
      ok: false,
      error: "requestFailed"
    });
    expect(ensureDiscount).not.toHaveBeenCalled();
    expect(diagnostic).toHaveBeenCalledWith(
      "[Directus server diagnostic]",
      expect.objectContaining({
        stage: "scholarship-history.read-attempts",
        errorName: "RequestError",
        errorMessage: "History unavailable",
        directusCode: "SERVICE_UNAVAILABLE",
        httpStatus: 503
      })
    );
    diagnostic.mockRestore();
  });

  it("fails safely when the service token is missing", async () => {
    delete process.env.DIRECTUS_SCHOLARSHIP_TOKEN;

    await expect(getActiveScholarshipRules()).resolves.toEqual({
      ok: false,
      error: "configuration"
    });
    expect(request).not.toHaveBeenCalled();
  });
});
