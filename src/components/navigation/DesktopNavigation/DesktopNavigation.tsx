"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { navigation } from "@/data/navigation";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import type { NavItem } from "@/types/content";
import styles from "./DesktopNavigation.module.css";

interface DesktopNavigationProps {
  locale: Locale;
}

export function DesktopNavigation({ locale }: DesktopNavigationProps) {
  const pathname = usePathname();
  const translate = useTranslations();
  const currentPathname = pathname || `/${locale}`;
  const [openHref, setOpenHref] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenHref(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <nav className={styles.nav} aria-label="Main navigation" onMouseLeave={() => setOpenHref(null)}>
      {navigation.map((item) => (
        <NavigationItem
          key={item.href}
          item={item}
          locale={locale}
          translate={translate}
          pathname={currentPathname}
          openHref={openHref}
          setOpenHref={setOpenHref}
        />
      ))}
    </nav>
  );
}

function NavigationItem({
  item,
  locale,
  translate,
  pathname,
  openHref,
  setOpenHref
}: {
  item: NavItem;
  locale: Locale;
  translate: (key: string) => string;
  pathname: string;
  openHref: string | null;
  setOpenHref: (href: string | null) => void;
}) {
  const menuId = useId();
  const href = localizedPath(locale, item.href);
  const isCurrent = pathname === href || (item.href !== "/" && pathname.startsWith(href));
  const shouldWrap = item.href === "/case-studies" || item.href === "/about";

  if (!item.children?.length) {
    return (
      <Link
        href={href}
        className={[styles.link, shouldWrap ? styles.wrapped : "", isCurrent ? styles.current : ""]
          .filter(Boolean)
          .join(" ")}
        aria-current={isCurrent ? "page" : undefined}
      >
          {translate(item.labelKey)}
      </Link>
    );
  }

  const isOpen = openHref === item.href;

  return (
    <div className={styles.item} onMouseEnter={() => setOpenHref(item.href)}>
      <button
        type="button"
        className={[
          styles.trigger,
          shouldWrap ? styles.wrapped : "",
          isCurrent ? styles.current : ""
        ]
          .filter(Boolean)
          .join(" ")}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setOpenHref(isOpen ? null : item.href)}
      >
        {translate(item.labelKey)}
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {isOpen ? (
        <div id={menuId} className={styles.menu}>
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={localizedPath(locale, child.href)}
              className={styles.menuLink}
              onClick={() => setOpenHref(null)}
            >
              {translate(child.labelKey)}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
