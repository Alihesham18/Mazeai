import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { trainingCopy } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/utilities/localize";
import { TrainingCatalog } from "./TrainingCatalog";
import styles from "./TrainingCatalogPage.module.css";

export function TrainingCatalogPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);

  return (
    <>
      <section className={styles.hero}>
        <Container>
          <p className={styles.eyebrow}>{localize(trainingCopy.academy, locale)}</p>
          <h1>{localize(trainingCopy.title, locale)}</h1>
          <p className={styles.heroDescription}>{localize(trainingCopy.description, locale)}</p>
        </Container>
      </section>
      <section className={styles.catalog} aria-label={localize(trainingCopy.title, locale)}>
        <Container>
          <TrainingCatalog locale={locale} />
        </Container>
      </section>
    </>
  );
}
