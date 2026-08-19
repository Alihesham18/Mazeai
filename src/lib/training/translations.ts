import { locales, type Locale } from "@/i18n/routing";

interface LocalizedDirectusValue {
  language: string;
}

export function resolveTrainingTranslation<T extends LocalizedDirectusValue>(
  translations: readonly T[] | null | undefined,
  locale: Locale,
  isUsable: (translation: T) => boolean
): T | null {
  const usable = (translations ?? []).filter(
    (translation) =>
      locales.includes(translation.language as Locale) && isUsable(translation)
  );

  return (
    usable.find((translation) => translation.language === locale) ??
    usable.find((translation) => translation.language === "en") ??
    locales
      .map((language) => usable.find((translation) => translation.language === language))
      .find((translation): translation is T => Boolean(translation)) ??
    null
  );
}
