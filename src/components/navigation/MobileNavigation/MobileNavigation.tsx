"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Menu, UserRound, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { navigation } from "@/data/navigation";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";
import type { AuthProfile } from "@/lib/auth/types";
import { logoutAction } from "@/lib/auth/actions";
import styles from "./MobileNavigation.module.css";

interface MobileNavigationProps {
  locale: Locale;
  profile?: AuthProfile | null;
}

export function MobileNavigation({ locale, profile = null }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const translate = useTranslations();
  const pathname = usePathname() || `/${locale}`;
  const openRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const panelId = useId();
  const titleId = useId();

  useEffect(() => {
    document.body.dataset.menuOpen = isOpen ? "true" : "false";
    if (isOpen) {
      wasOpenRef.current = true;
      closeRef.current?.focus();
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      openRef.current?.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key === "Tab" && isOpen) {
        const focusable = Array.from(
          panelRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
          ) ?? []
        );
        const first = focusable[0];
        const last = focusable.at(-1);

        if (!first || !last) return;

        if (
          event.shiftKey &&
          (document.activeElement === first || !panelRef.current?.contains(document.activeElement))
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
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
        ref={openRef}
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
        <div
          className={styles.overlay}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setIsOpen(false);
          }}
        >
          <div
            ref={panelRef}
            className={styles.panel}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className={styles.top}>
              <div>
                <Logo locale={locale} />
                <p className={styles.menuTitle} id={titleId}>
                  {translate("navigation.menu")}
                </p>
              </div>
              <div className={styles.topActions}>
                <LanguageSwitcher locale={locale} />
                <ThemeToggle />
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
            </div>
            <nav className={styles.list} aria-label={translate("navigation.mobileLabel")}>
              {navigation.map((item) => {
                const href = localizedPath(locale, item.href);
                const isCurrent =
                  pathname === href || (item.href !== "/" && pathname.startsWith(href));

                return item.children?.length ? (
                  <details className={isCurrent ? styles.currentGroup : undefined} key={item.href}>
                    <summary className={styles.summary}>
                      {translate(item.labelKey)}
                      <ChevronDown size={16} aria-hidden="true" />
                    </summary>
                    <div className={styles.children}>
                      {item.children.map((child) => {
                        const childHref = localizedPath(locale, child.href);
                        const isChildCurrent = pathname === childHref;

                        return (
                          <Link
                            key={child.href}
                            href={childHref}
                            className={[styles.childLink, isChildCurrent ? styles.current : ""]
                              .filter(Boolean)
                              .join(" ")}
                            aria-current={isChildCurrent ? "page" : undefined}
                            onClick={() => setIsOpen(false)}
                          >
                            {translate(child.labelKey)}
                          </Link>
                        );
                      })}
                    </div>
                  </details>
                ) : (
                  <Link
                    key={item.href}
                    href={href}
                    className={[styles.link, isCurrent ? styles.current : ""]
                      .filter(Boolean)
                      .join(" ")}
                    aria-current={isCurrent ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                  >
                    {translate(item.labelKey)}
                  </Link>
                );
              })}
              <div className={styles.accountSection}>
                {profile ? (
                  <>
                    <p className={styles.accountName}>
                      <UserRound size={18} aria-hidden="true" />
                      {profile.firstName || translate("auth.accountFallback")}
                    </p>
                    <Link
                      href={localizedPath(locale, "/account")}
                      className={styles.link}
                      onClick={() => setIsOpen(false)}
                    >
                      {translate("auth.myAccount")}
                    </Link>
                    <Link
                      href={localizedPath(locale, "/account/profile")}
                      className={styles.link}
                      onClick={() => setIsOpen(false)}
                    >
                      {translate("auth.profile")}
                    </Link>
                    <Link
                      href={localizedPath(locale, "/account/training-applications")}
                      className={styles.link}
                      onClick={() => setIsOpen(false)}
                    >
                      {translate("auth.trainingApplications")}
                    </Link>
                    <Link
                      href={localizedPath(locale, "/account/scholarship-exams")}
                      className={styles.link}
                      onClick={() => setIsOpen(false)}
                    >
                      {translate("auth.scholarshipExams")}
                    </Link>
                    <Link
                      href={localizedPath(locale, "/account/my-trainings")}
                      className={styles.link}
                      onClick={() => setIsOpen(false)}
                    >
                      {translate("auth.myTrainings")}
                    </Link>
                    <Link
                      href={localizedPath(locale, "/account/event-registrations")}
                      className={styles.link}
                      onClick={() => setIsOpen(false)}
                    >
                      {translate("auth.eventRegistrations")}
                    </Link>
                    <form action={logoutAction.bind(null, locale)}>
                      <button type="submit" className={[styles.link, styles.logout].join(" ")}>
                        <LogOut size={18} aria-hidden="true" />
                        {translate("auth.logOut")}
                      </button>
                    </form>
                  </>
                ) : (
                  <Link
                    href={localizedPath(locale, "/login")}
                    className={[styles.link, styles.login].join(" ")}
                    onClick={() => setIsOpen(false)}
                  >
                    <UserRound size={18} aria-hidden="true" />
                    {translate("auth.logIn")}
                  </Link>
                )}
              </div>
            </nav>
            <div className={styles.footerAction}>
              <Button href={localizedPath(locale, "/contact")} onClick={() => setIsOpen(false)}>
                {translate("navigation.partner")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
