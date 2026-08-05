import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import styles from "./about.module.css";

interface AboutPageProps {
  params: {
    locale: Locale;
  };
}

export default async function AboutPage({
  params
}: AboutPageProps) {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "pages.about"
  });

  const values = [
    {
      number: "01",
      title: t("vision.title"),
      description: t("vision.description")
    },
    {
      number: "02",
      title: t("mission.title"),
      description: t("mission.description")
    },
    {
      number: "03",
      title: t("approach.title"),
      description: t("approach.description")
    }
  ];

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>
              {t("eyebrow")}
            </p>

            <h1 className={styles.title}>
              {t("title")}
            </h1>

            <p className={styles.lead}>
              {t("lead")}
            </p>
          </div>

          <div
            className={styles.heroDecoration}
            aria-hidden="true"
          >
            <div className={styles.glow} />
            <div className={styles.mazeCircle}>
              <span>AI</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.introduction}>
        <div className={styles.container}>
          <div className={styles.introGrid}>
            <div>
              <p className={styles.sectionLabel}>
                {t("overview.label")}
              </p>

              <h2 className={styles.sectionTitle}>
                {t("overview.title")}
              </h2>
            </div>

            <div className={styles.copy}>
              <p>{t("overview.paragraphOne")}</p>
              <p>{t("overview.paragraphTwo")}</p>
              <p>{t("overview.paragraphThree")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.valuesSection}>
        <div className={styles.container}>
          <header className={styles.valuesHeader}>
            <div>
              <p className={styles.sectionLabel}>
                {t("valuesLabel")}
              </p>

              <h2 className={styles.sectionTitle}>
                {t("valuesTitle")}
              </h2>
            </div>

            <p className={styles.valuesIntroduction}>
              {t("valuesDescription")}
            </p>
          </header>

          <div className={styles.cards}>
            {values.map((value) => (
              <article
                className={styles.card}
                key={value.title}
              >
                <div className={styles.cardTop}>
                  <span className={styles.cardNumber}>
                    {value.number}
                  </span>

                  <span
                    className={styles.cardIcon}
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                </div>

                <h3 className={styles.cardTitle}>
                  {value.title}
                </h3>

                <p className={styles.cardDescription}>
                  {value.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.cta}>
            <div>
              <p className={styles.sectionLabel}>
                {t("cta.label")}
              </p>

              <h2 className={styles.ctaTitle}>
                {t("cta.title")}
              </h2>

              <p className={styles.ctaDescription}>
                {t("cta.description")}
              </p>
            </div>

            <a
              className={styles.ctaButton}
              href={`/${params.locale}/contact`}
            >
              {t("cta.button")}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}