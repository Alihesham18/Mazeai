export type CurrencyAmount = number | string;

export function toCurrencyNumber(amount: CurrencyAmount): number | null {
  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount) ? numericAmount : null;
}

export function formatTrainingFee(
  fee: CurrencyAmount,
  locale = "en",
  currency = "TRY"
): string {
  const numericFee = toCurrencyNumber(fee);
  if (numericFee === null) return "₺—";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0
  }).format(numericFee);
}
