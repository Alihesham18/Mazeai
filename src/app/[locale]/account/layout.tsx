import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountSectionNavigation } from "@/components/account/AccountSectionNavigation";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/routing";
import styles from "./layout.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });
  return { title: `${t("myAccount")} | SynergyMazeAI` };
}

export default async function AccountLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { locale: Locale };
}) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });

  return (
    <article className={styles.page}>
      <Container>
        <header className={styles.header}>
          <p>{t("accountEyebrow")}</p>
          <h1>{t("myAccount")}</h1>
          <span>{t("accountSupport")}</span>
        </header>
        <AccountSectionNavigation locale={params.locale} />
        {children}
      </Container>
    </article>
  );
}
