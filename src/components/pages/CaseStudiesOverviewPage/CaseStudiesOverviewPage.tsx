import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CaseStudyCoverImage } from "@/components/case-studies/CaseStudyCoverImage";
import { CaseStudySystemVisual } from "@/components/case-studies/CaseStudySystemVisual";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { TechnicalDetail } from "@/components/ui/TechnicalDetail";
import type { Locale } from "@/i18n/routing";
import { isInternalDemonstration } from "@/lib/case-studies/presentation";
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
  const workflowStages = [
    t("workflow.input"),
    t("workflow.analyze"),
    t("workflow.structure"),
    t("workflow.automate")
  ];

  return (
    <div className={styles.page}>
      <header className={styles.introduction}>
        <TechnicalDetail className={styles.headerGrid} variant="grid" />
        <Container className={styles.introductionInner}>
          <div className={styles.introductionMeta} aria-hidden="true">
            <span>08 / WORK</span>
            <span>MZ—SELECTED</span>
          </div>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h1>{t("pageTitle")}</h1>
          <p className={styles.lead}>{pageT("description")}</p>
        </Container>
      </header>

      <section className={styles.collection} aria-labelledby="selected-work-heading">
        <Container>
          <header className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>{t("collectionEyebrow")}</p>
              <h2 id="selected-work-heading">{t("collectionTitle")}</h2>
            </div>
            <p>{t("collectionDescription")}</p>
          </header>

          {!result.ok ? (
            <p className={styles.state} role="alert">{t("unableToLoad")}</p>
          ) : result.data.length === 0 ? (
            <p className={styles.state}>{t("empty")}</p>
          ) : (
            <div className={styles.records} data-single={result.data.length === 1 || undefined}>
              {result.data.map((caseStudy, index) => {
                const internalDemonstration = isInternalDemonstration(caseStudy);
                const projectType = internalDemonstration
                  ? t("projectTypes.internalDemonstration")
                  : t("projectTypes.selectedWork");

                return (
                  <article className={styles.record} key={caseStudy.id}>
                    <div className={styles.recordCopy}>
                      <div className={styles.recordTopline}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <span>{caseStudy.featured ? t("featured") : t("selectedEntry")}</span>
                      </div>

                      <div className={styles.recordLabels}>
                        {caseStudy.industry ? <span>{caseStudy.industry}</span> : null}
                        <strong>{projectType}</strong>
                      </div>

                      <h3>{caseStudy.title}</h3>
                      {caseStudy.shortDescription ? <p>{caseStudy.shortDescription}</p> : null}

                      <dl className={styles.metadata}>
                        <div>
                          <dt>{t("projectType")}</dt>
                          <dd>{projectType}</dd>
                        </div>
                        {caseStudy.industry ? (
                          <div>
                            <dt>{t("domain")}</dt>
                            <dd>{caseStudy.industry}</dd>
                          </div>
                        ) : null}
                        {!internalDemonstration && caseStudy.client ? (
                          <div>
                            <dt>{t("client")}</dt>
                            <dd>{caseStudy.client}</dd>
                          </div>
                        ) : null}
                      </dl>

                      {caseStudy.technologies.length > 0 ? (
                        <ul className={styles.technologies} aria-label={t("technologies")}>
                          {caseStudy.technologies.map((technology) => (
                            <li key={technology}>{technology}</li>
                          ))}
                        </ul>
                      ) : null}

                      <Link
                        className={styles.projectLink}
                        href={localizedPath(locale, `/case-studies/${caseStudy.slug}`)}
                      >
                        {internalDemonstration ? t("viewDemonstration") : t("exploreProject")}
                        <ArrowUpRight size={18} aria-hidden="true" />
                      </Link>
                    </div>

                    <div className={styles.recordVisual}>
                      {caseStudy.coverImage ? (
                        <CaseStudyCoverImage
                          alt={caseStudy.title}
                          className={styles.cover}
                          imageClassName={styles.coverImage}
                          priority={index === 0}
                          sizes="(min-width: 960px) 48vw, 100vw"
                          src={caseStudy.coverImage}
                        />
                      ) : (
                        <CaseStudySystemVisual
                          accessibleLabel={t("visualLabel", { title: caseStudy.title })}
                          stages={workflowStages}
                          compact
                        />
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {result.ok && result.data.length > 0 ? (
            <aside className={styles.disclosure}>
              <span aria-hidden="true">NOTE / 01</span>
              <p>{t("disclosure")}</p>
            </aside>
          ) : null}
        </Container>
      </section>

      <section className={styles.cta} aria-labelledby="selected-work-cta-heading">
        <Container className={styles.ctaInner}>
          <div>
            <p className={styles.eyebrow}>{t("cta.eyebrow")}</p>
            <h2 id="selected-work-cta-heading">{t("cta.title")}</h2>
            <p>{t("cta.description")}</p>
          </div>
          <div className={styles.ctaActions}>
            <Button href={localizedPath(locale, "/services")}>
              {t("cta.services")}
              <ArrowRight size={17} aria-hidden="true" />
            </Button>
            <Button href={localizedPath(locale, "/contact")} variant="outline">
              {t("cta.contact")}
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
