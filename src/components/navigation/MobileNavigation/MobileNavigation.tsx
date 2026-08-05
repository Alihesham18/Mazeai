"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { navigation } from "@/data/navigation";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import { Logo } from "@/components/ui/Logo";
import styles from "./MobileNavigation.module.css";

interface MobileNavigationProps {
  locale: Locale;
}

export function MobileNavigation({ locale }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const translate = useTranslations();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    document.body.dataset.menuOpen = isOpen ? "true" : "false";
    if (isOpen) {
      closeRef.current?.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.dataset.menuOpen = "false";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className={styles.openButton}
        aria-label={translate("navigation.openMenu")}
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <Menu aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className={styles.panel} id={panelId} role="dialog" aria-modal="true">
          <div className={styles.top}>
            <Logo locale={locale} />
            <button
              ref={closeRef}
              type="button"
              className={styles.closeButton}
              aria-label={translate("navigation.closeMenu")}
              onClick={() => setIsOpen(false)}
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <nav className={styles.list} aria-label="Mobile navigation">
            {navigation.map((item) =>
              item.children?.length ? (
                <details key={item.href}>
                  <summary className={styles.summary}>
                    {translate(item.labelKey)}
                    <ChevronDown size={16} aria-hidden="true" />
                  </summary>
                  <div className={styles.children}>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={localizedPath(locale, child.href)}
                        className={styles.childLink}
                        onClick={() => setIsOpen(false)}
                      >
                        {translate(child.labelKey)}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  key={item.href}
                  href={localizedPath(locale, item.href)}
                  className={styles.link}
                  onClick={() => setIsOpen(false)}
                >
                  {translate(item.labelKey)}
                </Link>
              )
            )}
          </nav>
        </div>
      ) : null}
    </>
  );
}
