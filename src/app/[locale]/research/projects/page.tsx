import { ArrowUpRight, Dna } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPageMetadata, type StandalonePageConfig } from "@/components/pages/StandalonePage";
import { ResearchPortfolioConsole } from "@/components/research/ResearchPortfolioConsole";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/Section";
import { TechnicalDetail, TechnicalLabel } from "@/components/ui/TechnicalDetail";
import { activeResearchProjects } from "@/data/active-research-projects";
import type { Locale } from "@/i18n/routing";
import { localize, localizedPath } from "@/lib/utilities/localize";
import styles from "./ResearchProjectsPage.module.css";

const page: StandalonePageConfig = {
  path: "research/projects",
  titleKey: "navigation.researchProjects",
  descriptionKey: "research.projects.description",
  sections: []
};

export const generateMetadata = createPageMetadata(page);

const categories = ["all", "machineLearning", "computerVision", "aiSystems", "appliedAI"] as const;

export default async function ResearchProjectsPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "research.projects" });
  const [featuredProject, ...portfolioProjects] = activeResearchProjects;

  return (
    <div className={styles.page}>
      <header className={styles.portfolioHeader}>
        <TechnicalDetail variant="grid" className={styles.headerGrid} />
        <Container className={styles.headerContent}>
          <div className={styles.introduction}>
            <div>
              <TechnicalLabel>{t("eyebrow")}</TechnicalLabel>
              <h1>{t("title")}</h1>
            </div>
            <div className={styles.introductionCopy}>
              <TechnicalDetail variant="line" />
              <p>{t("description")}</p>
            </div>
          </div>
          <ResearchPortfolioConsole
            ariaLabel={t("console.ariaLabel")}
            label={t("console.label")}
            status={t("console.status")}
            projects={activeResearchProjects.map(({ name }) => name)}
          />
        </Container>
      </header>

      <section className={styles.categoriesSection} aria-labelledby="research-category-title">
        <Container>
          <div className={styles.categoryHeading}>
            <TechnicalLabel index="01">{t("categories.eyebrow")}</TechnicalLabel>
            <h2 id="research-category-title">{t("categories.title")}</h2>
          </div>
          <nav className={styles.categoryIndex} aria-label={t("categories.ariaLabel")}>
            <ul>
              {categories.map((category, index) => (
                <li data-current={index === 0 || undefined} key={category}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  {t(`categories.items.${category}`)}
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </section>

      <section className={styles.featuredSection} aria-labelledby="featured-project-title">
        <Container>
          <SectionHeading
            eyebrow={t("featured.eyebrow")}
            title={<span id="featured-project-title">{t("featured.title")}</span>}
            description={t("featured.description")}
          />
          <article className={styles.featuredProject}>
            <TechnicalDetail variant="mazeCorner" className={styles.featuredCorner} />
            <div className={styles.featuredIdentity}>
              <span className={styles.recordLabel}>{t("featured.recordLabel")}</span>
              <Dna size={58} strokeWidth={1.25} aria-hidden="true" />
              <p>{localize(featuredProject.category, params.locale)}</p>
              <h3>{featuredProject.name}</h3>
              <dl className={styles.featuredMetadata}>
                <div><dt>{t("labels.field")}</dt><dd>{localize(featuredProject.category, params.locale)}</dd></div>
                <div><dt>{t("labels.focus")}</dt><dd>{t("featured.focus")}</dd></div>
              </dl>
            </div>
            <div className={styles.featuredDetails}>
              <p className={styles.featuredDescription}>{localize(featuredProject.description, params.locale)}</p>
              <TechnologyTags technologies={featuredProject.technologies} label={t("labels.technologies")} />
              <Button href={localizedPath(params.locale, `/research/projects/${featuredProject.slug}`)}>
                {t("featured.action")}
                <ArrowUpRight className={styles.directionalIcon} size={18} aria-hidden="true" />
              </Button>
            </div>
          </article>
        </Container>
      </section>

      <section className={styles.portfolioSection} aria-labelledby="project-portfolio-title">
        <Container>
          <SectionHeading
            eyebrow={t("portfolio.eyebrow")}
            title={<span id="project-portfolio-title">{t("portfolio.title")}</span>}
            description={t("portfolio.description")}
          />
          <div className={styles.portfolioGrid}>
            {portfolioProjects.map((project, index) => (
              <article className={styles.projectRecord} key={project.slug}>
                <header className={styles.recordHeader}>
                  <span>{t("portfolio.entry", { index: String(index + 1).padStart(2, "0") })}</span>
                  <span>{localize(project.category, params.locale)}</span>
                </header>
                <h3>{project.name}</h3>
                <p>{localize(project.description, params.locale)}</p>
                <TechnologyTags
                  technologies={project.technologies.slice(0, 3)}
                  label={t("labels.technologies")}
                />
                <Link
                  className={styles.projectLink}
                  href={localizedPath(params.locale, `/research/projects/${project.slug}`)}
                >
                  {t("portfolio.viewProject", { project: project.name })}
                  <ArrowUpRight className={styles.directionalIcon} size={17} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.collaborationSection} aria-labelledby="research-collaboration-title">
        <Container className={styles.collaborationPanel}>
          <TechnicalDetail variant="dots" className={styles.collaborationDots} />
          <div className={styles.collaborationCopy}>
            <TechnicalLabel>{t("collaboration.eyebrow")}</TechnicalLabel>
            <h2 id="research-collaboration-title">{t("collaboration.title")}</h2>
            <p>{t("collaboration.description")}</p>
            <ul>
              <li>{t("collaboration.audiences.universities")}</li>
              <li>{t("collaboration.audiences.organizations")}</li>
              <li>{t("collaboration.audiences.partners")}</li>
            </ul>
          </div>
          <div className={styles.collaborationActions}>
            <Button href={localizedPath(params.locale, "/contact")}>
              {t("collaboration.discussion")}
              <ArrowUpRight className={styles.directionalIcon} size={18} aria-hidden="true" />
            </Button>
            <Button href={localizedPath(params.locale, "/research/partnerships")} variant="outline">
              {t("collaboration.partnerships")}
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}

function TechnologyTags({ technologies, label }: { technologies: readonly string[]; label: string }) {
  return (
    <div className={styles.technologyGroup}>
      <span className={styles.technologyLabel}>{label}</span>
      <ul className={styles.technologyTags}>
        {technologies.map((technology) => <li key={technology}>{technology}</li>)}
      </ul>
    </div>
  );
}
