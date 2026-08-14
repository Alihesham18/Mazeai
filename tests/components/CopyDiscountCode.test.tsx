import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyDiscountCode } from "@/components/account/CopyDiscountCode";

describe("CopyDiscountCode", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("copies the code and temporarily confirms success", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText }
    });

    render(<CopyDiscountCode code="SYNERGY-52TUAS" copyLabel="Copy Code" copiedLabel="Copied!" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy Code" }));
    });

    expect(writeText).toHaveBeenCalledWith("SYNERGY-52TUAS");
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("button", { name: "Copy Code" })).toBeInTheDocument();
  });
});
