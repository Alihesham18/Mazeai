import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAttempt,
  getCurrentUserProfile,
  getDirectusProfile,
  getProgram,
  notFound
} = vi.hoisted(() => ({
  getAttempt: vi.fn(),
  getCurrentUserProfile: vi.fn(),
  getDirectusProfile: vi.fn(),
  getProgram: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  })
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async () => (key: string) => key)
}));
vi.mock("next/navigation", () => ({ notFound }));
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
    existingAttempt,
    program
  }: {
    attemptCheckFailed: boolean;
    existingAttempt: { id: string } | null;
    program: Record<string, unknown>;
  }) => (
    <div
      data-attempt-check-failed={String(attemptCheckFailed)}
      data-program-keys={Object.keys(program).sort().join(",")}
      data-program-slug={String(program.slug)}
      data-testid="scholarship-exam"
    >
      {existingAttempt?.id ?? String(program.title)}
    </div>
  )
}));

import TrainingScholarshipPage, {
  generateStaticParams
} from "@/app/[locale]/training/[slug]/scholarship/page";

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
    notFound.mockClear();
  });

  it("resolves supported scholarship slugs to the minimal localized client payload", async () => {
    getCurrentUserProfile.mockResolvedValueOnce(null);

    render(
      await TrainingScholarshipPage({
        params: { locale: "tr", slug: "mobile-programming" }
      })
    );

    expect(generateStaticParams()).toEqual(expect.arrayContaining([
      { slug: "data-science-machine-learning" },
      { slug: "mobile-programming" },
      { slug: "web-development-dotnet" },
      { slug: "cybersecurity" }
    ]));
    expect(screen.getByTestId("scholarship-exam")).toHaveTextContent("Mobil Programlama");
    expect(screen.getByTestId("scholarship-exam")).toHaveAttribute(
      "data-program-keys",
      "slug,title"
    );
    expect(screen.getByTestId("scholarship-exam")).toHaveAttribute(
      "data-program-slug",
      "mobile-programming"
    );
  });

  it("keeps unsupported scholarship slugs on the not-found path", async () => {
    await expect(
      TrainingScholarshipPage({ params: { locale: "en", slug: "unsupported-program" } })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledOnce();
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
