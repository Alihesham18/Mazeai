import type { Locale } from "@/i18n/routing";
import type { LocalizedText } from "@/types/content";

export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale] || text.en;
}

export function localizedPath(locale: Locale, href: string): string {
  if (href === "/") {
    return `/${locale}`;
  }

  return `/${locale}${href}`;
}
