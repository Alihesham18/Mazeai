export type CurrencyAmount = number | string;

export function toCurrencyNumber(amount: CurrencyAmount): number | null {
  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount) ? numericAmount : null;
}

export function formatTrainingFee(fee: CurrencyAmount): string {
  const numericFee = toCurrencyNumber(fee);
  if (numericFee === null) return "₺—";

  return `₺${numericFee.toLocaleString("en-US", {
    maximumFractionDigits: 0
  })}`;
}
