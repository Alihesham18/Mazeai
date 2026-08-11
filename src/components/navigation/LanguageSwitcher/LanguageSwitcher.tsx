"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Languages } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { locales, type Locale } from "@/i18n/routing";
import styles from "./LanguageSwitcher.module.css";

const languageCodes: Record<Locale, string> = {
  en: "EN",
  tr: "TR",
  ar: "AR",
  fa: "FA"
};

const languageNames: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
  ar: "العربية",
  fa: "فارسی"
};

function getLocalizedHref(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split("/").filter(Boolean);

  if (locales.includes(segments[0] as Locale)) {
    segments[0] = nextLocale;
    return `/${segments.join("/")}`;
  }

  return `/${nextLocale}`;
}

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const currentPathname = pathname || `/${locale}`;

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!switcherRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={styles.switcher} ref={switcherRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label="Choose language"
        title="Choose language"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Languages size={20} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div id={menuId} className={styles.menu} role="menu" aria-label="Choose language">
          {locales.map((nextLocale) => {
            const isCurrent = locale === nextLocale;

            return (
              <Link
                key={nextLocale}
                href={getLocalizedHref(currentPathname, nextLocale)}
                hrefLang={nextLocale}
                role="menuitem"
                aria-current={isCurrent ? "page" : undefined}
                className={[styles.option, isCurrent ? styles.selected : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setIsOpen(false)}
              >
                <span dir={nextLocale === "ar" || nextLocale === "fa" ? "rtl" : "ltr"}>
                  {languageNames[nextLocale]}
                </span>
                <span className={styles.optionMeta}>
                  <span className={styles.code}>{languageCodes[nextLocale]}</span>
                  {isCurrent ? <Check className={styles.check} size={16} aria-hidden="true" /> : null}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
