import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAttempt,
  getCurrentUserProfile,
  getDirectusProfile,
  getProgram
} = vi.hoisted(() => ({
  getAttempt: vi.fn(),
  getCurrentUserProfile: vi.fn(),
  getDirectusProfile: vi.fn(),
  getProgram: vi.fn()
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async () => (key: string) => key)
}));
vi.mock("next/navigation", () => ({ notFound: vi.fn() }));
vi.mock("@/lib/auth/user", () => ({
  getCurrentUserProfile,
  withDirectusProfilePhone: (user: unknown) => user
}));
vi.mock("@/lib/directus/profile", () => ({
  getCurrentUserDirectusProfile: getDirectusProfile
}));
vi.mock("@/lib/directus/training", () => ({
  getPublishedTrainingProgramBySlug: getProgram
}));
vi.mock("@/lib/directus/scholarship", () => ({
  getCurrentUserScholarshipAttemptForProgram: getAttempt
}));
vi.mock("@/components/training/ScholarshipExam", () => ({
  ScholarshipExam: ({
    attemptCheckFailed,
    existingAttempt
  }: {
    attemptCheckFailed: boolean;
    existingAttempt: { id: string } | null;
  }) => (
    <div
      data-attempt-check-failed={String(attemptCheckFailed)}
      data-testid="scholarship-exam"
    >
      {existingAttempt?.id ?? "new-exam"}
    </div>
  )
}));

import TrainingScholarshipPage from "@/app/[locale]/training/[slug]/scholarship/page";

const user = {
  id: "user-1",
  email: "user@example.com",
  firstName: "Test",
  lastName: "User",
  fullName: "Test User",
  telephone: "+905551234567"
};

describe("TrainingScholarshipPage", () => {
  beforeEach(() => {
    getCurrentUserProfile.mockReset().mockResolvedValue(user);
    getDirectusProfile.mockReset().mockResolvedValue({ ok: true, profile: null });
    getProgram.mockReset().mockResolvedValue({
      ok: true,
      data: {
        id: "program-1",
        slug: "mobile-programming",
        currency: "TRY"
      }
    });
    getAttempt.mockReset();
  });

  it("loads the policy-scoped completed attempt and prepares its discount", async () => {
    getAttempt.mockResolvedValue({
      ok: true,
      data: {
        id: "attempt-1",
        score: 8,
        totalQuestions: 10,
        percentage: 80,
        scholarshipPercentage: 30,
        discountCode: "SYNERGY-EXISTING",
        discountReady: true,
        hasHistoricDuplicates: false,
        status: "eligible",
        dateCreated: "2026-01-01T00:00:00Z"
      }
    });

    render(
      await TrainingScholarshipPage({
        params: { locale: "en", slug: "mobile-programming" }
      })
    );

    expect(getAttempt).toHaveBeenCalledWith("program-1", {
      prepareDiscount: { currency: "TRY" }
    });
    expect(screen.getByTestId("scholarship-exam")).toHaveTextContent("attempt-1");
  });

  it("fails closed when previous attempts cannot be verified", async () => {
    getAttempt.mockResolvedValue({ ok: false, error: "requestFailed" });

    render(
      await TrainingScholarshipPage({
        params: { locale: "en", slug: "mobile-programming" }
      })
    );

    expect(screen.getByTestId("scholarship-exam")).toHaveAttribute(
      "data-attempt-check-failed",
      "true"
    );
  });
});
