export const locales = ["en", "tr", "ar", "fa"] as const;
export const defaultLocale = "en";

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" || locale === "fa" ? "rtl" : "ltr";
}
