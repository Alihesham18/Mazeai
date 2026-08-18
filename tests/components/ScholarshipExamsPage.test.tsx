import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccountUser, getAttempts } = vi.hoisted(() => ({
  requireAccountUser: vi.fn(),
  getAttempts: vi.fn()
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async () => (key: string) => key)
}));
vi.mock("@/lib/auth/account", () => ({ requireAccountUser }));
vi.mock("@/lib/directus/scholarship", () => ({
  getCurrentUserScholarshipAttempts: getAttempts
}));
vi.mock("@/components/account/CopyDiscountCode", () => ({
  CopyDiscountCode: ({ code }: { code: string }) => (
    <button data-code={code} type="button">
      copyCode
    </button>
  )
}));

import ScholarshipExamsPage from "@/app/[locale]/account/scholarship-exams/page";

const eligibleAttempt = {
  id: "attempt-1",
  score: 9,
  totalQuestions: 10,
  percentage: 90,
  scholarshipPercentage: 40,
  discountCode: "SYNERGY-PERSISTED",
  discountReady: true,
  status: "eligible" as const,
  dateCreated: "2026-08-01T10:00:00Z",
  program: {
    id: "program-1",
    slug: "ai-foundations",
    title: "AI Foundations",
    currency: "TRY"
  }
};

describe("ScholarshipExamsPage", () => {
  beforeEach(() => {
    requireAccountUser.mockReset().mockResolvedValue({ id: "current-user-uuid" });
    getAttempts.mockReset();
  });

  it("renders the exact persisted code only after its discount record is ready", async () => {
    getAttempts.mockResolvedValue({ ok: true, data: [eligibleAttempt] });

    render(await ScholarshipExamsPage({ params: { locale: "en" } }));

    expect(requireAccountUser).toHaveBeenCalledWith("en", "/account/scholarship-exams");
    expect(screen.getByText("SYNERGY-PERSISTED")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "copyCode" })).toHaveAttribute(
      "data-code",
      "SYNERGY-PERSISTED"
    );
    expect(screen.getByRole("link", { name: "redeemScholarshipFromProfile" })).toHaveAttribute(
      "href",
      "/en/account/profile"
    );
    expect(screen.queryByText("takeAgain")).not.toBeInTheDocument();
  });

  it("does not present an unsynchronized code as redeemable", async () => {
    getAttempts.mockResolvedValue({
      ok: true,
      data: [{ ...eligibleAttempt, discountReady: false }]
    });

    render(await ScholarshipExamsPage({ params: { locale: "en" } }));

    expect(screen.queryByText("SYNERGY-PERSISTED")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "copyCode" })).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("scholarshipDiscountUnavailable");
  });

  it("shows the page-level error only when scholarship history cannot be read", async () => {
    getAttempts.mockResolvedValue({ ok: false, error: "requestFailed" });

    render(await ScholarshipExamsPage({ params: { locale: "en" } }));

    expect(screen.getByText("scholarshipAttemptsUnavailable")).toBeInTheDocument();
  });

  it("keeps a historic not-eligible attempt with the same trusted result values", async () => {
    getAttempts.mockResolvedValue({
      ok: true,
      data: [
        {
          ...eligibleAttempt,
          id: "attempt-not-eligible",
          score: 4,
          percentage: 40,
          scholarshipPercentage: null,
          discountCode: null,
          discountReady: false,
          status: "not_eligible"
        }
      ]
    });

    render(await ScholarshipExamsPage({ params: { locale: "en" } }));

    expect(screen.getByText("4 / 10")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("scholarshipStatus.notEligible")).toBeInTheDocument();
    expect(screen.queryByText("scholarshipAward")).not.toBeInTheDocument();
    expect(screen.queryByText("takeAgain")).not.toBeInTheDocument();
  });
});
