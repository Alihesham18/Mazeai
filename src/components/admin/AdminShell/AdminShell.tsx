"use client";

import { Menu, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  adminNavigationGroups,
  getActiveAdminNavigationItem,
  type AdminNavigationItem
} from "@/config/admin-navigation";
import { getDirection, type Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./AdminShell.module.css";

export interface AdminIdentity {
  email: string;
  firstName: string;
  lastName: string;
}

interface AdminShellProps {
  children: ReactNode;
  identity: AdminIdentity;
  locale: Locale;
}

interface AdminNavigationProps {
  activeItem: AdminNavigationItem | null;
  locale: Locale;
  onNavigate?: () => void;
}

function AdminNavigation({ activeItem, locale, onNavigate }: AdminNavigationProps) {
  const t = useTranslations("adminAuth");

  return (
    <nav className={styles.navigation} aria-label={t("navigationLabel")}>
      {adminNavigationGroups.map((group, groupIndex) => (
        <div className={styles.navigationGroup} key={group.labelKey ?? `primary-${groupIndex}`}>
          {group.labelKey ? <p className={styles.groupLabel}>{t(group.labelKey)}</p> : null}
          <div className={styles.navigationItems}>
            {group.items.map((item) => {
              const active = activeItem?.path === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  href={localizedPath(locale, item.path)}
                  className={active ? styles.activeLink : styles.navigationLink}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                >
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function AdminBrand({ locale }: { locale: Locale }) {
  const t = useTranslations("adminAuth");

  return (
    <Link className={styles.brand} href={localizedPath(locale, "/admin")}>
      <span className={styles.brandIcon} aria-hidden="true">
        <ShieldCheck size={22} />
      </span>
      <span>
        <strong>{t("title")}</strong>
        <small>MazeAI</small>
      </span>
    </Link>
  );
}

function AdminIdentityBlock({ identity }: { identity: AdminIdentity }) {
  const t = useTranslations("adminAuth");
  const fullName = [identity.firstName, identity.lastName].filter(Boolean).join(" ");

  return (
    <div className={styles.identity}>
      <span className={styles.avatar} aria-hidden="true">
        {(identity.firstName || identity.email).slice(0, 1).toUpperCase()}
      </span>
      <span className={styles.identityText}>
        <small>{t("administratorAccount")}</small>
        <strong>{fullName || identity.email}</strong>
        <span dir="ltr">{identity.email}</span>
      </span>
    </div>
  );
}

export function AdminShell({ children, identity, locale }: AdminShellProps) {
  const t = useTranslations("adminAuth");
  const pathname = usePathname() ?? localizedPath(locale, "/admin");
  const activeItem = getActiveAdminNavigationItem(pathname, locale);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationId = useId();

  useEffect(() => {
    document.body.dataset.menuOpen = mobileOpen ? "true" : "false";
    if (mobileOpen) closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.dataset.menuOpen = "false";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  const closeMobileNavigation = () => setMobileOpen(false);

  return (
    <div className={styles.shell} dir={getDirection(locale)} data-testid="admin-shell">
      <aside className={styles.sidebar}>
        <AdminBrand locale={locale} />
        <AdminNavigation activeItem={activeItem} locale={locale} />
        <AdminIdentityBlock identity={identity} />
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuButton}
            aria-label={t("menu")}
            aria-controls={mobileNavigationId}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu aria-hidden="true" />
          </button>
          <div className={styles.pageContext}>
            <small>{t("title")}</small>
            <strong>{t(activeItem?.labelKey ?? "navigation.dashboard")}</strong>
          </div>
          <AdminIdentityBlock identity={identity} />
        </header>

        <div className={styles.content}>{children}</div>
      </div>

      {mobileOpen ? (
        <div className={styles.mobileLayer}>
          <button
            type="button"
            className={styles.backdrop}
            aria-label={t("closeMenu")}
            onClick={closeMobileNavigation}
          />
          <aside
            className={styles.mobileDrawer}
            id={mobileNavigationId}
            role="dialog"
            aria-modal="true"
            aria-label={t("navigationLabel")}
          >
            <div className={styles.drawerHeader}>
              <AdminBrand locale={locale} />
              <button
                ref={closeButtonRef}
                type="button"
                className={styles.closeButton}
                aria-label={t("closeMenu")}
                onClick={closeMobileNavigation}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <AdminNavigation
              activeItem={activeItem}
              locale={locale}
              onNavigate={closeMobileNavigation}
            />
            <AdminIdentityBlock identity={identity} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
