import { describe, expect, it } from "vitest";
import { formatTrainingFee, toCurrencyNumber } from "@/lib/utilities/currency";

describe("training fee currency formatting", () => {
  it.each([
    ["90000.00000", "₺90,000"],
    ["100000.00000", "₺100,000"],
    [90000, "₺90,000"],
    ["7500.50000", "₺7,501"]
  ])("formats %s with a lira symbol and no fraction digits", (fee, expected) => {
    expect(formatTrainingFee(fee)).toBe(expected);
  });

  it("normalizes valid Directus decimal strings", () => {
    expect(toCurrencyNumber("90000.00000")).toBe(90000);
  });

  it("does not render invalid values as NaN", () => {
    expect(toCurrencyNumber("not-a-fee")).toBeNull();
    expect(formatTrainingFee("not-a-fee")).toBe("₺—");
  });
});
