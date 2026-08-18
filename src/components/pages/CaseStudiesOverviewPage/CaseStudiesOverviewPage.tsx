import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CaseStudyCoverImage } from "@/components/case-studies/CaseStudyCoverImage";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/routing";
import { getPublishedCaseStudies } from "@/lib/directus/case-studies";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./CaseStudiesOverviewPage.module.css";

export async function CaseStudiesOverviewPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [result, t, pageT] = await Promise.all([
    getPublishedCaseStudies(locale),
    getTranslations({ locale, namespace: "caseStudies" }),
    getTranslations({ locale, namespace: "pages.caseStudies" })
  ]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Container>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h1>{pageT("title")}</h1>
          <p className={styles.lead}>{pageT("description")}</p>
        </Container>
      </section>

      <section className={styles.collection} aria-labelledby="case-studies-heading">
        <Container>
          <header className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{t("collectionEyebrow")}</p>
            <h2 id="case-studies-heading">{t("collectionTitle")}</h2>
          </header>

          {!result.ok ? (
            <p className={styles.state} role="alert">{t("unableToLoad")}</p>
          ) : result.data.length === 0 ? (
            <p className={styles.state}>{t("empty")}</p>
          ) : (
            <div className={styles.grid}>
              {result.data.map((caseStudy) => (
                <article
                  className={styles.card}
                  data-featured={caseStudy.featured || undefined}
                  key={caseStudy.id}
                >
                  {caseStudy.coverImage ? (
                    <CaseStudyCoverImage
                      alt={caseStudy.title}
                      className={styles.cover}
                      imageClassName={styles.coverImage}
                      sizes="(min-width: 720px) 33vw, 100vw"
                      src={caseStudy.coverImage}
                    />
                  ) : null}
                  <div className={styles.cardBody}>
                    <div className={styles.topline}>
                      {caseStudy.industry ? <span>{caseStudy.industry}</span> : null}
                      {caseStudy.featured ? <strong>{t("featured")}</strong> : null}
                    </div>
                    <h3>{caseStudy.title}</h3>
                    {caseStudy.shortDescription ? <p>{caseStudy.shortDescription}</p> : null}
                    {caseStudy.client ? (
                      <p className={styles.client}>
                        <span>{t("client")}</span> {caseStudy.client}
                      </p>
                    ) : null}
                    {caseStudy.technologies.length > 0 ? (
                      <ul className={styles.technologies} aria-label={t("technologies")}>
                        {caseStudy.technologies.map((technology) => (
                          <li key={technology}>{technology}</li>
                        ))}
                      </ul>
                    ) : null}
                    <Link
                      className={styles.link}
                      href={localizedPath(locale, `/case-studies/${caseStudy.slug}`)}
                    >
                      {t("readCaseStudy", { title: caseStudy.title })}
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
