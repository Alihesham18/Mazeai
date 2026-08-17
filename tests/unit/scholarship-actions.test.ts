import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAttempt, getProgram, getRules, getUser, revalidatePath } = vi.hoisted(() => ({
  createAttempt: vi.fn(),
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
  getActiveScholarshipRules: getRules
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

  it.each([
    "user",
    "training_program",
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

  it("rejects an unknown or unpublished training slug", async () => {
    getProgram.mockResolvedValue({ ok: true, data: null });

    await expect(
      submitScholarshipExamAction("unknown-program", initialState, form())
    ).resolves.toEqual({ status: "error", message: "invalidSubmission" });
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
