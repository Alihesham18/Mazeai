import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CaseStudyCoverImage } from "@/components/case-studies/CaseStudyCoverImage";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/routing";
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
  const sections = [
    { key: "challenge", title: t("challenge"), content: caseStudy.challenge },
    { key: "solution", title: t("solution"), content: caseStudy.solution },
    { key: "results", title: t("results"), content: caseStudy.results }
  ].filter((section): section is { key: string; title: string; content: string } =>
    Boolean(section.content)
  );

  return (
    <main>
      <article className={styles.page}>
        <header className={styles.hero}>
          <Container>
            <Link className={styles.backLink} href={localizedPath(locale, "/case-studies")}>
              <ArrowLeft size={18} aria-hidden="true" />
              {t("back")}
            </Link>
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                {caseStudy.industry ? <p className={styles.eyebrow}>{caseStudy.industry}</p> : null}
                <h1>{caseStudy.title}</h1>
                {caseStudy.shortDescription ? (
                  <p className={styles.lead}>{caseStudy.shortDescription}</p>
                ) : null}
                {caseStudy.client || caseStudy.technologies.length > 0 ? (
                  <dl className={styles.meta}>
                    {caseStudy.client ? (
                      <div><dt>{t("client")}</dt><dd>{caseStudy.client}</dd></div>
                    ) : null}
                    {caseStudy.technologies.length > 0 ? (
                      <div>
                        <dt>{t("technologies")}</dt>
                        <dd>
                          <ul className={styles.technologies}>
                            {caseStudy.technologies.map((technology) => (
                              <li key={technology}>{technology}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
              </div>
              {caseStudy.coverImage ? (
                <CaseStudyCoverImage
                  alt={caseStudy.title}
                  className={styles.cover}
                  imageClassName={styles.coverImage}
                  priority
                  sizes="(min-width: 960px) 48vw, 100vw"
                  src={caseStudy.coverImage}
                />
              ) : null}
            </div>
          </Container>
        </header>

        {sections.length > 0 ? (
          <div className={styles.sections}>
            {sections.map((section, index) => (
              <section className={styles.section} key={section.key}>
                <Container className={styles.sectionGrid}>
                  <header className={styles.sectionHeading}>
                    <p>{String(index + 1).padStart(2, "0")}</p>
                    <h2>{section.title}</h2>
                  </header>
                  <p className={styles.sectionContent}>{section.content}</p>
                </Container>
              </section>
            ))}
          </div>
        ) : null}

        {caseStudy.content ? (
          <section className={styles.contentSection} aria-labelledby="case-study-content-heading">
            <Container className={styles.sectionGrid}>
              <header className={styles.sectionHeading}>
                <p>{String(sections.length + 1).padStart(2, "0")}</p>
                <h2 id="case-study-content-heading">{t("overview")}</h2>
              </header>
              <div className={styles.richText}>{caseStudy.content}</div>
            </Container>
          </section>
        ) : null}
      </article>
    </main>
  );
}

export async function CaseStudyLoadError({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "caseStudies" });
  return (
    <main className={styles.errorPage}>
      <Container>
        <h1>{t("detailUnavailableTitle")}</h1>
        <p role="alert">{t("detailUnavailable")}</p>
        <Link className={styles.backLink} href={localizedPath(locale, "/case-studies")}>
          <ArrowLeft size={18} aria-hidden="true" />
          {t("back")}
        </Link>
      </Container>
    </main>
  );
}
