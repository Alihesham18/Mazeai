import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { actionState, formStatus } = vi.hoisted(() => ({
  actionState: { current: { status: "idle" as string, message: undefined as string | undefined } },
  formStatus: { current: { pending: false } }
}));

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return {
    ...actual,
    useFormState: () => [actionState.current, "test-action"],
    useFormStatus: () => formStatus.current
  };
});
vi.mock("@/lib/discounts/actions", () => ({
  redeemDiscountAction: vi.fn()
}));
vi.mock("@/lib/discounts/state", () => ({
  initialDiscountActionState: { status: "idle" }
}));

import { Discounts } from "@/components/account/Discounts";

describe("Discounts account UI", () => {
  it("shows the empty state and accessible redemption form", () => {
    actionState.current = { status: "idle", message: undefined };
    render(<Discounts locale="en" discounts={[]} />);
    expect(screen.getByRole("textbox", { name: "inputLabel" })).toBeRequired();
    expect(screen.getByRole("button", { name: "redeem" })).toBeEnabled();
    expect(screen.getByText("emptyTitle")).toBeInTheDocument();
  });

  it("shows the pending submit state", () => {
    formStatus.current = { pending: true };
    render(<Discounts locale="en" discounts={[]} />);
    expect(screen.getByRole("button", { name: "redeeming" })).toBeDisabled();
    formStatus.current = { pending: false };
  });

  it("shows localized success and invalid-code states", () => {
    actionState.current = { status: "success", message: "REDEMPTION_SUCCESS" };
    const { rerender } = render(<Discounts locale="en" discounts={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("messages.REDEMPTION_SUCCESS");

    actionState.current = { status: "error", message: "INVALID_CODE" };
    rerender(<Discounts locale="en" discounts={[]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("messages.INVALID_CODE");
  });
});
