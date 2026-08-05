"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { locales, type Locale } from "@/i18n/routing";
import styles from "./LanguageSwitcher.module.css";

const labels: Record<Locale, string> = {
  en: "EN",
  tr: "TR",
  ar: "AR"
};

function getLocalizedHref(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split("/").filter(Boolean);

  if (locales.includes(segments[0] as Locale)) {
    segments[0] = nextLocale;
    return `/${segments.join("/")}`;
  }

  return `/${nextLocale}`;
}

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const currentPathname = pathname || `/${locale}`;

  return (
    <nav className={styles.switcher} aria-label={label}>
      <Languages size={16} aria-hidden="true" />
      {locales.map((nextLocale) => (
        <Link
          key={nextLocale}
          href={getLocalizedHref(currentPathname, nextLocale)}
          hrefLang={nextLocale}
          aria-current={locale === nextLocale ? "true" : undefined}
          className={[styles.link, locale === nextLocale ? styles.active : ""]
            .filter(Boolean)
            .join(" ")}
        >
          {labels[nextLocale]}
        </Link>
      ))}
    </nav>
  );
}
