import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormState: () => [{ status: "idle" }, "test-action"],
    useFormStatus: () => ({ pending: false })
  };
});
vi.mock("@/lib/discounts/training-actions", () => ({
  quoteTrainingDiscountAction: vi.fn(),
  applyTrainingDiscountAction: vi.fn()
}));
vi.mock("@/lib/discounts/training-state", () => ({
  initialTrainingDiscountState: { status: "idle" }
}));

import { TrainingDiscountPricing } from "@/components/account/TrainingDiscountPricing";

describe("TrainingDiscountPricing", () => {
  it("shows original and final pricing when no discount is applicable", () => {
    render(
      <TrainingDiscountPricing
        locale="en"
        applicationId="application-1"
        originalFee="90000.00"
        currency="TRY"
        overview={{ available: [], applied: null }}
      />
    );

    expect(screen.getByText("originalFee")).toBeInTheDocument();
    expect(screen.getByText("availableDiscounts")).toBeInTheDocument();
    expect(screen.getByText("noApplicableDiscounts")).toBeInTheDocument();
    expect(screen.getByText("discountAmount")).toBeInTheDocument();
    expect(screen.getByText("finalFee")).toBeInTheDocument();
  });

  it("displays recorded trusted amounts for an already-used discount", () => {
    render(
      <TrainingDiscountPricing
        locale="en"
        applicationId="application-1"
        originalFee="90000.00"
        currency="TRY"
        overview={{
          available: [],
          applied: {
            redemptionId: "redemption-1",
            code: "TEST20",
            title: "Test 20",
            originalAmount: "90000.00",
            discountAmount: "18000.00",
            finalAmount: "72000.00",
            currency: "TRY"
          }
        }}
      />
    );

    expect(screen.getByText("discountApplied")).toBeInTheDocument();
    expect(screen.getByText("TEST20")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "applyDiscount" })).not.toBeInTheDocument();
  });
});
