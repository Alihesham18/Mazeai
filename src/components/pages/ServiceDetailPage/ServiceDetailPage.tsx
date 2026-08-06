import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, MoveUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { WebDevelopmentProject } from "@/data/web-development-projects";
import { projectPageCopy } from "@/data/web-development-projects";
import type { Locale } from "@/i18n/routing";
import { localizedPath, localize } from "@/lib/utilities/localize";
import styles from "./ServiceDetailPage.module.css";

type ServiceKey = "webDevelopment" | "webDesign";

interface ServiceDetailPageProps {
  locale: Locale;
  serviceKey: ServiceKey;
  image: string;
  technologies: readonly string[];
  projects?: readonly WebDevelopmentProject[];
}

const featureKeys = ["one", "two", "three", "four"] as const;
const processKeys = ["one", "two", "three", "four"] as const;

export async function ServiceDetailPage({
  locale,
  serviceKey,
  image,
  technologies,
  projects
}: ServiceDetailPageProps) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: `services.${serviceKey}` });
  const common = await getTranslations({ locale, namespace: "services.common" });

  return (
    <>
      <section className={styles.hero}>
        <Container>
          <Link className={styles.backLink} href={localizedPath(locale, "/services")}>
            <ArrowLeft size={17} aria-hidden="true" />
            {common("backToServices")}
          </Link>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{t("eyebrow")}</p>
              <h1>{t("title")}</h1>
              <p className={styles.lead}>{t("intro")}</p>
              <Button href={localizedPath(locale, "/contact")}>
                {common("startProject")}
                <MoveUpRight size={18} aria-hidden="true" />
              </Button>
            </div>
            <div className={styles.heroMedia}>
              <Image
                src={image}
                alt={t("imageAlt")}
                fill
                priority
                sizes="(min-width: 980px) 48vw, 100vw"
                className={styles.image}
              />
            </div>
          </div>
        </Container>
      </section>

      <section className={styles.section}>
        <Container className={styles.overviewGrid}>
          <div>
            <p className={styles.eyebrow}>{common("whatWeDo")}</p>
            <h2>{t("overviewTitle")}</h2>
          </div>
          <p className={styles.overviewText}>{t("overviewText")}</p>
        </Container>
      </section>

      <section className={styles.section}>
        <Container>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{common("included")}</p>
            <h2>{t("featuresTitle")}</h2>
          </div>
          <div className={styles.featureGrid}>
            {featureKeys.map((key) => (
              <article className={styles.feature} key={key}>
                <span className={styles.check} aria-hidden="true">
                  <Check size={18} />
                </span>
                <h3>{t(`features.${key}.title`)}</h3>
                <p>{t(`features.${key}.description`)}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.section}>
        <Container className={styles.processGrid}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{common("howItWorks")}</p>
            <h2>{t("processTitle")}</h2>
          </div>
          <ol className={styles.processList}>
            {processKeys.map((key, index) => (
              <li key={key}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{t(`process.${key}.title`)}</h3>
                  <p>{t(`process.${key}.description`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className={styles.section}>
        <Container>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{common("tools")}</p>
            <h2>{t("technologiesTitle")}</h2>
          </div>
          <ul className={styles.technologyList}>
            {technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
        </Container>
      </section>

      {projects?.length ? (
        <section className={styles.projectsSection} aria-labelledby="selected-projects-title">
          <Container>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>{common("included")}</p>
              <h2 id="selected-projects-title">
                {localize(projectPageCopy.projectsTitle, locale)}
              </h2>
              <p>{localize(projectPageCopy.projectsDescription, locale)}</p>
            </div>
            <div className={styles.projectGrid}>
              {projects.map((project) => (
                <Link
                  className={styles.projectCard}
                  href={localizedPath(locale, `/services/web-development/${project.slug}`)}
                  key={project.slug}
                >
                  <span className={styles.projectMedia}>
                    <Image
                      src={project.image}
                      alt={`${localize(project.title, locale)} dashboard`}
                      fill
                      sizes="(min-width: 800px) 50vw, 100vw"
                    />
                  </span>
                  <span className={styles.projectContent}>
                    <strong>{localize(project.title, locale)}</strong>
                    <span>{localize(project.overview, locale)}</span>
                    <span className={styles.projectLink}>
                      {localize(projectPageCopy.viewProject, locale)}
                      <MoveUpRight size={18} aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className={styles.ctaSection}>
        <Container className={styles.cta}>
          <div>
            <h2>{t("ctaTitle")}</h2>
            <p>{t("ctaText")}</p>
          </div>
          <Button href={localizedPath(locale, "/contact")}>{common("startProject")}</Button>
        </Container>
      </section>
    </>
  );
}
