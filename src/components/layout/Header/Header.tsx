"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { DesktopNavigation } from "@/components/navigation/DesktopNavigation";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";
import { MobileNavigation } from "@/components/navigation/MobileNavigation";
import { AccountNavigation } from "@/components/navigation/AccountNavigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { Locale } from "@/i18n/routing";
import type { AuthProfile } from "@/lib/auth/types";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./Header.module.css";

export function Header({ locale, user }: { locale: Locale; user: AuthProfile | null }) {
  const t = useTranslations();
  const pathname = usePathname();
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;

  return (
    <header className={styles.header} data-home={isHome}>
      <Container className={styles.inner}>
        <Logo locale={locale} />
        <DesktopNavigation locale={locale} />
        <div className={styles.actions}>
          <ThemeToggle className={styles.desktopThemeToggle} />
          <div className={styles.desktopLanguage}>
            <LanguageSwitcher locale={locale} />
          </div>
          <AccountNavigation locale={locale} profile={user} className={styles.desktopAccount} />
          <Button
            href={localizedPath(locale, "/contact")}
            className={styles.desktopCta}
            variant="primary"
          >
            {t("navigation.partner")}
          </Button>
          <MobileNavigation locale={locale} profile={user} />
        </div>
      </Container>
    </header>
  );
}
