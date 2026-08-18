import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAttempt, getExistingAttempt, getProgram, getRules, getUser, revalidatePath } = vi.hoisted(() => ({
  createAttempt: vi.fn(),
  getExistingAttempt: vi.fn(),
  getProgram: vi.fn(),
  getRules: vi.fn(),
  getUser: vi.fn(),
  revalidatePath: vi.fn()
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/directus/auth", () => ({ getCurrentDirectusUser: getUser }));
vi.mock("@/lib/directus/training", () => ({
  getPublishedTrainingProgramBySlug: getProgram
}));
vi.mock("@/lib/directus/scholarship", () => ({
  createTrustedScholarshipAttempt: createAttempt,
  getActiveScholarshipRules: getRules,
  getCurrentUserScholarshipAttemptForProgram: getExistingAttempt
}));

import { submitScholarshipExamAction } from "@/lib/scholarship/actions";

const initialState = { status: "idle" } as const;

function form(selectedOption = 0, extra?: [string, string]) {
  const data = new FormData();
  data.set(
    "answers",
    JSON.stringify(
      Array.from({ length: 10 }, (_, index) => ({
        questionId: `q${index + 1}`,
        selectedOption
      }))
    )
  );
  if (extra) data.set(...extra);
  return data;
}

const globalRules = [
  {
    id: "rule-90",
    training_program: null,
    minimum_percentage: 90,
    discount_percentage: 40,
    active: true
  },
  {
    id: "rule-60",
    training_program: null,
    minimum_percentage: 60,
    discount_percentage: 10,
    active: true
  }
];

describe("scholarship submission action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ id: "authenticated-user" });
    getProgram.mockResolvedValue({
      ok: true,
      data: {
        id: "program-uuid",
        slug: "mobile-programming",
        status: "published",
        currency: "TRY"
      }
    });
    getRules.mockResolvedValue({ ok: true, data: globalRules });
    getExistingAttempt.mockResolvedValue({ ok: true, data: null });
    createAttempt.mockResolvedValue({
      ok: true,
      data: {
        attemptId: "attempt-uuid",
        discountCode: "SYNERGY-ABC234",
        discountReady: true
      }
    });
  });

  it("rejects unauthenticated submissions before any scoring lookup", async () => {
    getUser.mockResolvedValue(null);

    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, form())
    ).resolves.toEqual({ status: "error", message: "sessionExpired" });
    expect(getProgram).not.toHaveBeenCalled();
    expect(createAttempt).not.toHaveBeenCalled();
  });

  it("fails safely when authentication throws", async () => {
    const diagnostic = vi.spyOn(console, "error").mockImplementation(() => {});
    getUser.mockRejectedValueOnce(new TypeError("session backend unavailable"));

    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, form())
    ).resolves.toEqual({ status: "error", message: "sessionExpired" });
    expect(diagnostic).toHaveBeenCalledWith(
      "[Directus server diagnostic]",
      expect.objectContaining({ stage: "scholarship-submission.authenticate" })
    );
    expect(createAttempt).not.toHaveBeenCalled();
    diagnostic.mockRestore();
  });

  it.each([
    "user",
    "userId",
    "training_program",
    "programId",
    "score",
    "total_questions",
    "percentage",
    "scholarship_percentage",
    "discount_code",
    "status"
  ])("rejects the client-provided trusted field %s", async (field) => {
    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, form(0, [field, "forged"]))
    ).resolves.toEqual({ status: "error", message: "invalidSubmission" });
    expect(createAttempt).not.toHaveBeenCalled();
  });

  it("resolves program and ownership server-side and saves an eligible result", async () => {
    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, form())
    ).resolves.toMatchObject({
      status: "success",
      result: {
        score: 10,
        totalQuestions: 10,
        percentage: 100,
        scholarshipPercentage: 40,
        discountCode: "SYNERGY-ABC234",
        discountReady: true,
        status: "eligible"
      }
    });

    expect(getProgram).toHaveBeenCalledWith("mobile-programming");
    expect(getExistingAttempt).toHaveBeenNthCalledWith(1, "program-uuid", {
      prepareDiscount: { currency: "TRY" }
    });
    expect(getExistingAttempt).toHaveBeenNthCalledWith(2, "program-uuid");
    expect(createAttempt).toHaveBeenCalledWith({
      userId: "authenticated-user",
      programId: "program-uuid",
      score: 10,
      totalQuestions: 10,
      percentage: 100,
      scholarshipPercentage: 40,
      status: "eligible",
      currency: "TRY"
    });
    expect(createAttempt).toHaveBeenCalledTimes(1);
  });

  it.each(["eligible", "not_eligible"] as const)(
    "blocks a second attempt when the policy-scoped existing attempt is %s",
    async (status) => {
      getExistingAttempt.mockResolvedValueOnce({
        ok: true,
        data: {
          id: "existing-attempt",
          score: status === "eligible" ? 9 : 3,
          totalQuestions: 10,
          percentage: status === "eligible" ? 90 : 30,
          scholarshipPercentage: status === "eligible" ? 40 : null,
          discountCode: status === "eligible" ? "SYNERGY-EXISTING" : null,
          discountReady: status === "eligible",
          status,
          dateCreated: "2026-01-01T00:00:00Z"
        }
      });

      await expect(
        submitScholarshipExamAction("mobile-programming", initialState, form())
      ).resolves.toMatchObject({
        status: "alreadyAttempted",
        message: "alreadyAttempted",
        existingAttempt: {
          id: "existing-attempt",
          score: status === "eligible" ? 9 : 3,
          status
        }
      });
      expect(getRules).not.toHaveBeenCalled();
      expect(createAttempt).not.toHaveBeenCalled();
    }
  );

  it("allows the same user to attempt a different training program", async () => {
    getProgram
      .mockResolvedValueOnce({
        ok: true,
        data: { id: "program-mobile", slug: "mobile-programming", currency: "TRY" }
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          id: "program-data",
          slug: "data-science-machine-learning",
          currency: "TRY"
        }
      });

    await submitScholarshipExamAction("mobile-programming", initialState, form());
    await submitScholarshipExamAction("data-science-machine-learning", initialState, form());

    expect(createAttempt).toHaveBeenCalledTimes(2);
    expect(createAttempt.mock.calls.map(([input]) => input.programId)).toEqual([
      "program-mobile",
      "program-data"
    ]);
  });

  it("allows different authenticated users to attempt the same training", async () => {
    getUser
      .mockResolvedValueOnce({ id: "user-a" })
      .mockResolvedValueOnce({ id: "user-b" });

    await submitScholarshipExamAction("mobile-programming", initialState, form());
    await submitScholarshipExamAction("mobile-programming", initialState, form());

    expect(createAttempt).toHaveBeenCalledTimes(2);
    expect(createAttempt.mock.calls.map(([input]) => input.userId)).toEqual([
      "user-a",
      "user-b"
    ]);
  });

  it("serializes duplicate submissions and creates only one attempt and discount", async () => {
    let persisted = false;
    getExistingAttempt.mockImplementation(async () => ({
      ok: true,
      data: persisted
        ? {
            id: "attempt-uuid",
            score: 10,
            totalQuestions: 10,
            percentage: 100,
            scholarshipPercentage: 40,
            discountCode: "SYNERGY-ONLYONE",
            discountReady: true,
            status: "eligible",
            dateCreated: "2026-08-18T00:00:00Z"
          }
        : null
    }));
    createAttempt.mockImplementationOnce(async () => {
      persisted = true;
      return {
        ok: true,
        data: {
          attemptId: "attempt-uuid",
          discountCode: "SYNERGY-ONLYONE",
          discountReady: true
        }
      };
    });

    const results = await Promise.all([
      submitScholarshipExamAction("mobile-programming", initialState, form()),
      submitScholarshipExamAction("mobile-programming", initialState, form())
    ]);

    expect(results).toContainEqual(expect.objectContaining({ status: "success" }));
    expect(results).toContainEqual(
      expect.objectContaining({ status: "alreadyAttempted", message: "alreadyAttempted" })
    );
    expect(createAttempt).toHaveBeenCalledTimes(1);
  });

  it("fails closed when previous attempts cannot be verified", async () => {
    getExistingAttempt.mockResolvedValueOnce({ ok: false, error: "requestFailed" });

    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, form())
    ).resolves.toEqual({ status: "error", message: "attemptVerificationFailed" });
    expect(getRules).not.toHaveBeenCalled();
    expect(createAttempt).not.toHaveBeenCalled();
  });

  it("does not award a discount below every configured threshold", async () => {
    createAttempt.mockResolvedValue({
      ok: true,
      data: { attemptId: "attempt-uuid", discountCode: null, discountReady: false }
    });

    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, form(1))
    ).resolves.toMatchObject({
      result: {
        score: 0,
        scholarshipPercentage: null,
        discountCode: null,
        discountReady: false,
        status: "not_eligible"
      }
    });
  });

  it("stores an under-review result when Directus has no active applicable rules", async () => {
    getRules.mockResolvedValue({ ok: true, data: [] });
    createAttempt.mockResolvedValue({
      ok: true,
      data: { attemptId: "attempt-uuid", discountCode: null, discountReady: false }
    });

    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, form())
    ).resolves.toMatchObject({
      result: {
        scholarshipPercentage: null,
        discountCode: null,
        discountReady: false,
        status: "under_review"
      }
    });
  });

  it("rejects an unknown question id without creating an attempt", async () => {
    const data = form();
    const parsed = JSON.parse(String(data.get("answers")));
    parsed[9].questionId = "unknown";
    data.set("answers", JSON.stringify(parsed));

    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, data)
    ).resolves.toEqual({ status: "error", message: "invalidSubmission" });
    expect(createAttempt).not.toHaveBeenCalled();
  });

  it("rejects missing and empty answer sets without creating an attempt", async () => {
    const missing = form();
    const answers = JSON.parse(String(missing.get("answers")));
    answers.pop();
    missing.set("answers", JSON.stringify(answers));

    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, missing)
    ).resolves.toEqual({ status: "error", message: "incompleteSubmission" });

    const empty = new FormData();
    empty.set("answers", "[]");
    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, empty)
    ).resolves.toEqual({ status: "error", message: "incompleteSubmission" });
    expect(createAttempt).not.toHaveBeenCalled();
  });

  it("rejects duplicate questions and invalid answer options", async () => {
    const duplicate = form();
    const duplicateAnswers = JSON.parse(String(duplicate.get("answers")));
    duplicateAnswers[9].questionId = "q9";
    duplicate.set("answers", JSON.stringify(duplicateAnswers));
    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, duplicate)
    ).resolves.toEqual({ status: "error", message: "invalidSubmission" });

    const invalidOption = form();
    const invalidAnswers = JSON.parse(String(invalidOption.get("answers")));
    invalidAnswers[9].selectedOption = 99;
    invalidOption.set("answers", JSON.stringify(invalidAnswers));
    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, invalidOption)
    ).resolves.toEqual({ status: "error", message: "invalidSubmission" });
    expect(createAttempt).not.toHaveBeenCalled();
  });

  it.each(["null", "{}", "not-json"])("rejects malformed answer payload %s", async (raw) => {
    const data = new FormData();
    data.set("answers", raw);
    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, data)
    ).resolves.toEqual({ status: "error", message: "invalidSubmission" });
    expect(getProgram).not.toHaveBeenCalled();
  });

  it("rejects oversized payloads and unexpected answer properties", async () => {
    const oversized = new FormData();
    oversized.set("answers", "x".repeat(20_001));
    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, oversized)
    ).resolves.toEqual({ status: "error", message: "invalidSubmission" });

    const extraProperty = form();
    const answers = JSON.parse(String(extraProperty.get("answers")));
    answers[0].score = 10;
    extraProperty.set("answers", JSON.stringify(answers));
    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, extraProperty)
    ).resolves.toEqual({ status: "error", message: "invalidSubmission" });
    expect(createAttempt).not.toHaveBeenCalled();
  });

  it("calculates score, total questions, and percentage from the official exam", async () => {
    const data = form();
    const answers = JSON.parse(String(data.get("answers")));
    answers[9].selectedOption = 1;
    data.set("answers", JSON.stringify(answers));

    await submitScholarshipExamAction("mobile-programming", initialState, data);

    expect(createAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ score: 9, totalQuestions: 10, percentage: 90 })
    );
  });

  it("rejects a Directus program that does not match the official exam slug", async () => {
    getProgram.mockResolvedValueOnce({
      ok: true,
      data: { id: "other-program", slug: "cybersecurity", currency: "TRY" }
    });

    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, form())
    ).resolves.toEqual({ status: "error", message: "examUnavailable" });
    expect(getExistingAttempt).not.toHaveBeenCalled();
    expect(createAttempt).not.toHaveBeenCalled();
  });

  it("rejects an unknown or unpublished training slug", async () => {
    await expect(
      submitScholarshipExamAction("unknown-program", initialState, form())
    ).resolves.toEqual({ status: "error", message: "examUnavailable" });
    expect(getProgram).not.toHaveBeenCalled();
    expect(createAttempt).not.toHaveBeenCalled();
  });

  it("fails safely when rules or attempt persistence are unavailable", async () => {
    getRules.mockResolvedValueOnce({ ok: false, error: "requestFailed" });
    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, form())
    ).resolves.toEqual({ status: "error", message: "submissionFailed" });

    getRules.mockResolvedValueOnce({ ok: true, data: globalRules });
    createAttempt.mockResolvedValueOnce({ ok: false, error: "requestFailed" });
    await expect(
      submitScholarshipExamAction("mobile-programming", initialState, form())
    ).resolves.toEqual({ status: "error", message: "submissionFailed" });
  });
});
