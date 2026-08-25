import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CaseStudyCoverImage } from "@/components/case-studies/CaseStudyCoverImage";
import { CaseStudySystemVisual } from "@/components/case-studies/CaseStudySystemVisual";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/routing";
import {
  hasPublishableCaseStudyContent,
  isInternalDemonstration
} from "@/lib/case-studies/presentation";
import type { CaseStudy } from "@/lib/directus/case-studies";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./CaseStudyDetailPage.module.css";

export async function CaseStudyDetailPage({
  caseStudy,
  locale
}: {
  caseStudy: CaseStudy;
  locale: Locale;
}) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "caseStudies" });
  const internalDemonstration = isInternalDemonstration(caseStudy);
  const projectType = internalDemonstration
    ? t("projectTypes.internalDemonstration")
    : t("projectTypes.selectedWork");
  const overviewContent = hasPublishableCaseStudyContent(caseStudy.content)
    ? caseStudy.content
    : caseStudy.shortDescription;
  const narrativeSections = [
    { key: "overview", title: t("detail.projectOverview"), content: overviewContent },
    { key: "challenge", title: t("detail.problemOpportunity"), content: caseStudy.challenge },
    { key: "solution", title: t("detail.conceptApproach"), content: caseStudy.solution },
    ...(!internalDemonstration && caseStudy.results
      ? [{ key: "results", title: t("results"), content: caseStudy.results }]
      : [])
  ].filter((section): section is { key: string; title: string; content: string } =>
    Boolean(section.content)
  );
  const workflowStages = [
    t("workflow.input"),
    t("workflow.analyze"),
    t("workflow.structure"),
    t("workflow.automate")
  ];

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <Container>
          <Link className={styles.backLink} href={localizedPath(locale, "/case-studies")}>
            <ArrowLeft size={18} aria-hidden="true" />
            {t("back")}
          </Link>

          <div className={styles.headerGrid}>
            <div className={styles.headerCopy}>
              <div className={styles.identityLine}>
                <span>WORK / 01</span>
                <strong>{projectType}</strong>
              </div>
              <p className={styles.eyebrow}>{caseStudy.industry || t("selectedEntry")}</p>
              <h1>{caseStudy.title}</h1>
              {caseStudy.shortDescription ? <p className={styles.lead}>{caseStudy.shortDescription}</p> : null}

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
                {caseStudy.technologies.length > 0 ? (
                  <div>
                    <dt>{t("technologies")}</dt>
                    <dd>{caseStudy.technologies.join(" / ")}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className={styles.headerVisual}>
              {caseStudy.coverImage ? (
                <CaseStudyCoverImage
                  alt={caseStudy.title}
                  className={styles.cover}
                  imageClassName={styles.coverImage}
                  priority
                  sizes="(min-width: 960px) 48vw, 100vw"
                  src={caseStudy.coverImage}
                />
              ) : (
                <CaseStudySystemVisual
                  accessibleLabel={t("visualLabel", { title: caseStudy.title })}
                  stages={workflowStages}
                />
              )}
            </div>
          </div>
        </Container>
      </header>

      {narrativeSections.length > 0 ? (
        <div className={styles.narrative}>
          {narrativeSections.map((section, index) => (
            <section className={styles.section} key={section.key} aria-labelledby={`work-${section.key}`}>
              <Container className={styles.sectionGrid}>
                <header className={styles.sectionHeading}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h2 id={`work-${section.key}`}>{section.title}</h2>
                </header>
                <p className={styles.sectionContent}>{section.content}</p>
              </Container>
            </section>
          ))}
        </div>
      ) : null}

      {internalDemonstration ? (
        <section className={styles.flowSection} aria-labelledby="work-system-flow">
          <Container>
            <header className={styles.flowHeading}>
              <div>
                <p className={styles.eyebrow}>{t("detail.systemLabel")}</p>
                <h2 id="work-system-flow">{t("detail.systemFlow")}</h2>
              </div>
              <p>{t("detail.systemFlowDescription")}</p>
            </header>
            <ol className={styles.flow}>
              {workflowStages.map((stage, index) => (
                <li key={stage}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{stage}</strong>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      ) : null}

      {caseStudy.technologies.length > 0 ? (
        <section className={styles.stackSection} aria-labelledby="work-technology-stack">
          <Container className={styles.stackGrid}>
            <header>
              <p className={styles.eyebrow}>{t("detail.technologyLabel")}</p>
              <h2 id="work-technology-stack">{t("detail.technologies")}</h2>
            </header>
            <ul aria-label={t("technologies")}>
              {caseStudy.technologies.map((technology, index) => (
                <li key={technology}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{technology}</strong>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {internalDemonstration ? (
        <section className={styles.scopeSection} aria-labelledby="work-demonstration-scope">
          <Container className={styles.scopeInner}>
            <div>
              <p className={styles.eyebrow}>{t("detail.scopeLabel")}</p>
              <h2 id="work-demonstration-scope">{t("detail.demonstrationScope")}</h2>
            </div>
            <p>{t("detail.demonstrationScopeDescription")}</p>
          </Container>
        </section>
      ) : null}

      <section className={styles.cta} aria-labelledby="work-detail-cta">
        <Container className={styles.ctaInner}>
          <div>
            <p className={styles.eyebrow}>{t("cta.eyebrow")}</p>
            <h2 id="work-detail-cta">{t("detail.ctaTitle")}</h2>
            <p>{t("detail.ctaDescription")}</p>
          </div>
          <div className={styles.ctaActions}>
            <Button href={localizedPath(locale, "/services")}>
              {t("cta.services")}
              <ArrowRight size={17} aria-hidden="true" />
            </Button>
            <Button href={localizedPath(locale, "/contact")} variant="outline">
              {t("detail.startConversation")}
            </Button>
          </div>
        </Container>
      </section>
    </article>
  );
}

export async function CaseStudyLoadError({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "caseStudies" });
  return (
    <div className={styles.errorPage}>
      <Container>
        <h1>{t("detailUnavailableTitle")}</h1>
        <p role="alert">{t("detailUnavailable")}</p>
        <Link className={styles.backLink} href={localizedPath(locale, "/case-studies")}>
          <ArrowLeft size={18} aria-hidden="true" />
          {t("back")}
        </Link>
      </Container>
    </div>
  );
}
