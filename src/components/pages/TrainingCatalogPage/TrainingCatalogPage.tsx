import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/routing";
import { TrainingCatalog } from "./TrainingCatalog";
import { getLocalizedPublishedTrainingPrograms } from "@/lib/directus/training";
import { getCurrentUserProfile } from "@/lib/auth/user";
import styles from "./TrainingCatalogPage.module.css";

export async function TrainingCatalogPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [programResult, user, t] = await Promise.all([
    getLocalizedPublishedTrainingPrograms(locale),
    getCurrentUserProfile(),
    getTranslations({ locale, namespace: "training" })
  ]);
  const programs = programResult.ok ? programResult.data : [];

  return (
    <>
      <section className={styles.hero}>
        <Container>
          <p className={styles.eyebrow}>{t("academy")}</p>
          <h1>{t("title")}</h1>
          <p className={styles.heroDescription}>{t("description")}</p>
        </Container>
      </section>
      <section className={styles.catalog} aria-label={t("title")}>
        <Container>
          {!programResult.ok ? (
            <p className={styles.emptyState} role="alert">{t("unavailable")}</p>
          ) : programs.length === 0 ? (
            <p className={styles.emptyState}>{t("empty")}</p>
          ) : (
            <TrainingCatalog locale={locale} programs={programs} authenticated={Boolean(user)} />
          )}
        </Container>
      </section>
    </>
  );
}
