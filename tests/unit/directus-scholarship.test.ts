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
  getCurrentUserScholarshipAttemptForProgram,
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

  it("finds the earliest current-user attempt by training without filtering hidden user", async () => {
    request.mockResolvedValueOnce([
      {
        id: "oldest-attempt",
        score: 8,
        total_questions: 10,
        percentage: 80,
        scholarship_percentage: 30,
        discount_code: null,
        status: "eligible",
        date_created: "2026-01-01T00:00:00Z"
      }
    ]);

    await expect(
      getCurrentUserScholarshipAttemptForProgram("program-1")
    ).resolves.toEqual({
      ok: true,
      data: {
        id: "oldest-attempt",
        score: 8,
        totalQuestions: 10,
        percentage: 80,
        scholarshipPercentage: 30,
        discountCode: null,
        discountReady: false,
        hasHistoricDuplicates: false,
        status: "eligible",
        dateCreated: "2026-01-01T00:00:00Z"
      }
    });
    const query = request.mock.calls[0][0].command.query;
    expect(request.mock.calls[0][0].token).toBe("user-token");
    expect(query.filter).toEqual({ training_program: { _eq: "program-1" } });
    expect(query.filter).not.toHaveProperty("user");
    expect(query.fields).not.toContain("user");
    expect(query.sort).toEqual(["date_created", "id"]);
    expect(query.limit).toBe(2);
  });

  it("prepares an existing eligible discount for the completed page", async () => {
    request.mockResolvedValueOnce([
      {
        id: "attempt-1",
        score: 9,
        total_questions: 10,
        percentage: 90,
        scholarship_percentage: 40,
        discount_code: "SYNERGY-EXISTING",
        status: "eligible",
        date_created: "2026-01-01T00:00:00Z"
      }
    ]);

    const result = await getCurrentUserScholarshipAttemptForProgram("program-1", {
      prepareDiscount: { currency: "try" }
    });

    expect(result.ok && result.data).toMatchObject({
      id: "attempt-1",
      discountCode: "SYNERGY-EXISTING",
      discountReady: true,
      hasHistoricDuplicates: false
    });
    expect(ensureDiscount).toHaveBeenCalledWith({
      code: "SYNERGY-EXISTING",
      userId: "user-1",
      awardPercentage: 40,
      currency: "TRY"
    });
  });

  it("does not prepare another discount when historic duplicates exist", async () => {
    const attempt = {
      score: 9,
      total_questions: 10,
      percentage: 90,
      scholarship_percentage: 40,
      discount_code: "SYNERGY-EXISTING",
      status: "eligible",
      date_created: "2026-01-01T00:00:00Z"
    };
    request.mockResolvedValueOnce([
      { ...attempt, id: "official-attempt" },
      { ...attempt, id: "duplicate-attempt", date_created: "2026-02-01T00:00:00Z" }
    ]);

    const result = await getCurrentUserScholarshipAttemptForProgram("program-1", {
      prepareDiscount: { currency: "TRY" }
    });

    expect(result.ok && result.data).toMatchObject({
      id: "official-attempt",
      discountReady: false,
      hasHistoricDuplicates: true
    });
    expect(ensureDiscount).not.toHaveBeenCalled();
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

  it("accepts an eligible first-attempt response with a null discount code", async () => {
    request
      .mockResolvedValueOnce({ id: "attempt-1", discount_code: null })
      .mockResolvedValueOnce([
        {
          id: "attempt-1",
          score: 9,
          total_questions: 10,
          percentage: 90,
          scholarship_percentage: 40,
          discount_code: null,
          status: "eligible",
          date_created: "2026-08-18T00:00:00Z"
        }
      ]);

    await expect(
      createTrustedScholarshipAttempt(input, { codeFactory: () => "SYNERGY-ABC234" })
    ).resolves.toEqual({
      ok: true,
      data: { attemptId: "attempt-1", discountCode: null, discountReady: false }
    });
    expect(ensureDiscount).not.toHaveBeenCalled();
  });

  it("recovers a non-eligible persisted attempt when Directus create returns null", async () => {
    request
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce([
        {
          id: "attempt-1",
          score: 3,
          total_questions: 10,
          percentage: 30,
          scholarship_percentage: null,
          discount_code: null,
          status: "not_eligible",
          date_created: "2026-08-18T00:00:00Z"
        }
      ]);

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
    expect(request.mock.calls[1][0].command.query.filter).toEqual({
      training_program: { _eq: "program-1" }
    });
    expect(request.mock.calls[1][0].command.query.filter).not.toHaveProperty("user");
    expect(ensureDiscount).not.toHaveBeenCalled();
  });

  it("recovers an eligible attempt using its persisted award and synchronizes its code", async () => {
    request
      .mockResolvedValueOnce({ id: "attempt-1" })
      .mockResolvedValueOnce([
        {
          id: "attempt-1",
          score: 9,
          total_questions: 10,
          percentage: 90,
          scholarship_percentage: 35,
          discount_code: "SYNERGY-PERSISTED",
          status: "eligible",
          date_created: "2026-08-18T00:00:00Z"
        }
      ]);

    await expect(
      createTrustedScholarshipAttempt(input, { codeFactory: () => "SYNERGY-PERSISTED" })
    ).resolves.toEqual({
      ok: true,
      data: {
        attemptId: "attempt-1",
        discountCode: "SYNERGY-PERSISTED",
        discountReady: true
      }
    });
    expect(ensureDiscount).toHaveBeenCalledWith({
      code: "SYNERGY-PERSISTED",
      userId: "user-1",
      awardPercentage: 35,
      currency: "TRY"
    });
  });

  it("does not synchronize a recovered attempt when historic duplicates exist", async () => {
    const recoveredAttempt = {
      score: 9,
      total_questions: 10,
      percentage: 90,
      scholarship_percentage: 40,
      discount_code: "SYNERGY-PERSISTED",
      status: "eligible",
      date_created: "2026-08-18T00:00:00Z"
    };
    request
      .mockResolvedValueOnce({ id: "attempt-1" })
      .mockResolvedValueOnce([
        { ...recoveredAttempt, id: "attempt-1" },
        {
          ...recoveredAttempt,
          id: "attempt-duplicate",
          date_created: "2026-08-19T00:00:00Z"
        }
      ]);

    await expect(
      createTrustedScholarshipAttempt(input, { codeFactory: () => "SYNERGY-PERSISTED" })
    ).resolves.toEqual({
      ok: true,
      data: {
        attemptId: "attempt-1",
        discountCode: "SYNERGY-PERSISTED",
        discountReady: false
      }
    });
    const creates = request.mock.calls.filter(
      ([call]) => call.command.operation === "create"
    );
    expect(creates).toHaveLength(1);
    expect(ensureDiscount).not.toHaveBeenCalled();
  });

  it("recovers a persisted attempt after a post-create request error without creating again", async () => {
    request
      .mockRejectedValueOnce(new TypeError("response normalization failed"))
      .mockResolvedValueOnce([
        {
          id: "attempt-1",
          score: 9,
          total_questions: 10,
          percentage: 90,
          scholarship_percentage: 40,
          discount_code: "SYNERGY-PERSISTED",
          status: "eligible",
          date_created: "2026-08-18T00:00:00Z"
        }
      ]);

    await expect(
      createTrustedScholarshipAttempt(input, { codeFactory: () => "SYNERGY-PERSISTED" })
    ).resolves.toEqual({
      ok: true,
      data: {
        attemptId: "attempt-1",
        discountCode: "SYNERGY-PERSISTED",
        discountReady: true
      }
    });
    const creates = request.mock.calls.filter(
      ([call]) => call.command.operation === "create"
    );
    expect(creates).toHaveLength(1);
    expect(ensureDiscount).toHaveBeenCalledTimes(1);
  });

  it("retries with a new code when Directus reports a unique collision", async () => {
    request
      .mockRejectedValueOnce({ errors: [{ message: "Value has to be unique" }] })
      .mockResolvedValueOnce([])
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
    expect(request).toHaveBeenCalledTimes(3);
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

  it("keeps a persisted eligible attempt successful when discount synchronization fails", async () => {
    request.mockResolvedValueOnce({ id: "attempt-1", discount_code: "SYNERGY-ABC234" });
    ensureDiscount.mockResolvedValueOnce({ ok: false, error: "SERVER_ERROR" });

    await expect(
      createTrustedScholarshipAttempt(input, { codeFactory: () => "SYNERGY-ABC234" })
    ).resolves.toEqual({
      ok: true,
      data: {
        attemptId: "attempt-1",
        discountCode: "SYNERGY-ABC234",
        discountReady: false
      }
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(ensureDiscount).toHaveBeenCalledTimes(1);
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

  it("keeps a historic eligible attempt with a null code visible", async () => {
    request.mockResolvedValueOnce([
      {
        id: "historic-attempt",
        score: 8,
        total_questions: 10,
        percentage: 80,
        scholarship_percentage: 30,
        discount_code: null,
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

    const result = await getCurrentUserScholarshipAttempts();

    expect(result.ok && result.data[0]).toMatchObject({
      id: "historic-attempt",
      discountCode: null,
      discountReady: false,
      status: "eligible"
    });
    expect(ensureDiscount).not.toHaveBeenCalled();
  });

  it("preserves historic duplicates without issuing another scholarship discount", async () => {
    const duplicate = {
      score: 9,
      total_questions: 10,
      percentage: 90,
      scholarship_percentage: 40,
      status: "eligible",
      training_program: {
        id: "program-1",
        slug: "leadership",
        title: "Leadership",
        currency: "TRY"
      }
    };
    request.mockResolvedValueOnce([
      {
        ...duplicate,
        id: "newer-attempt",
        date_created: "2026-02-01T00:00:00Z",
        discount_code: "SYNERGY-NEWER"
      },
      {
        ...duplicate,
        id: "official-attempt",
        date_created: "2026-01-01T00:00:00Z",
        discount_code: "SYNERGY-OFFICIAL"
      }
    ]);

    const result = await getCurrentUserScholarshipAttempts();

    expect(result.ok && result.data).toHaveLength(2);
    expect(result.ok && result.data.map((attempt) => attempt.id)).toEqual([
      "newer-attempt",
      "official-attempt"
    ]);
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
      {
        ...attempt,
        id: "working",
        discount_code: "SYNERGY-WORKING",
        training_program: {
          ...attempt.training_program,
          id: "program-2",
          slug: "data-science"
        }
      }
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
