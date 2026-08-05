import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./StandalonePage.module.css";

export interface StandalonePageConfig {
  path: string;
  titleKey: string;
  descriptionKey: string;
  sections: readonly string[];
  legal?: boolean;
}

interface StandalonePageProps {
  locale: Locale;
  page: StandalonePageConfig;
}

export function createPageMetadata(page: StandalonePageConfig) {
  return async ({ params }: { params: { locale: Locale } }): Promise<Metadata> => {
    const t = await getTranslations({ locale: params.locale });

    return {
      title: `${t(page.titleKey)} | SynergyMazeAI`,
      description: t(page.descriptionKey),
      alternates: {
        canonical: `/${params.locale}/${page.path}`
      }
    };
  };
}

export async function StandalonePage({ locale, page }: StandalonePageProps) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <Section className={styles.hero}>
      <Container className={styles.wrap}>
        <div>
          <Badge>{t("common.placeholder")}</Badge>
          <h1>{t(page.titleKey)}</h1>
          <p className={styles.lead}>{t(page.descriptionKey)}</p>
        </div>
        <div className={styles.grid}>
          <Card>
            <h2>{t("common.sectionsIncluded")}</h2>
            <ul className={styles.sectionList}>
              {page.sections.map((section) => (
                <li key={section}>{section}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2>SynergyMazeAI</h2>
            <p>{t("common.phaseNote")}</p>
            <Button href={localizedPath(locale, "/contact")}>{t("navigation.partner")}</Button>
          </Card>
        </div>
        {page.legal ? <p className={styles.notice}>{t(page.descriptionKey)}</p> : null}
      </Container>
    </Section>
  );
}
