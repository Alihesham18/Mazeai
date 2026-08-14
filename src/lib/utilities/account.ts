import type { Locale } from "@/i18n/routing";

export function formatAccountDate(value: string | null, locale: Locale) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}
