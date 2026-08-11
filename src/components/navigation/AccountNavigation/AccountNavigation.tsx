"use client";

import Link from "next/link";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { logoutAction } from "@/lib/auth/actions";
import type { AuthProfile } from "@/lib/auth/types";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./AccountNavigation.module.css";

interface AccountNavigationProps {
  locale: Locale;
  profile: AuthProfile | null;
  className?: string;
}

export function AccountNavigation({ locale, profile, className = "" }: AccountNavigationProps) {
  const t = useTranslations("auth");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => setIsOpen(false), [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  if (!profile) {
    return (
      <Link className={[styles.login, className].filter(Boolean).join(" ")} href={localizedPath(locale, "/login")}>
        {t("logIn")}
      </Link>
    );
  }

  const links = [
    [t("myAccount"), localizedPath(locale, "/account")],
    [t("myTrainings"), `${localizedPath(locale, "/account")}#trainings`],
    [t("scholarshipExams"), `${localizedPath(locale, "/account")}#scholarship-exams`],
    [t("applications"), `${localizedPath(locale, "/account")}#applications`]
  ] as const;

  return (
    <div ref={rootRef} className={[styles.account, className].filter(Boolean).join(" ")}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={t("openAccountMenu")}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
      >
        <UserRound size={18} aria-hidden="true" />
        <span>{profile.firstName || t("accountFallback")}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div id={menuId} className={styles.menu} role="menu" aria-label={t("accountMenu")}>
          {links.map(([label, href]) => (
            <Link key={href} href={href} role="menuitem" className={styles.menuLink} onClick={() => setIsOpen(false)}>
              {label}
            </Link>
          ))}
          <form action={logoutAction.bind(null, locale)} className={styles.logoutForm}>
            <button type="submit" role="menuitem" className={styles.logout}>
              <LogOut size={16} aria-hidden="true" />
              {t("logOut")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
