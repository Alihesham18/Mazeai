"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { DesktopNavigation } from "@/components/navigation/DesktopNavigation";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";
import { MobileNavigation } from "@/components/navigation/MobileNavigation";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./Header.module.css";

export function Header({ locale }: { locale: Locale }) {
  const t = useTranslations();
  const pathname = usePathname();
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;

  return (
    <header className={styles.header} data-home={isHome}>
      <Container className={styles.inner}>
        <Logo locale={locale} />
        <DesktopNavigation locale={locale} />
        <div className={styles.actions}>
          <LanguageSwitcher locale={locale} label={t("navigation.language")} />
          <Button
            href={localizedPath(locale, "/contact")}
            className={styles.desktopCta}
            variant="primary"
          >
            {t("navigation.partner")}
          </Button>
          <MobileNavigation locale={locale} />
        </div>
      </Container>
    </header>
  );
}
