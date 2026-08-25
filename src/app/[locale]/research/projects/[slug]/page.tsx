import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Code2, Dna, Navigation, Route, Waves, type LucideIcon } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { TechnicalDetail, TechnicalLabel } from "@/components/ui/TechnicalDetail";
import {
  activeResearchProjects,
  getActiveResearchProject,
  researchPageCopy,
  type ResearchProjectIcon
} from "@/data/active-research-projects";
import type { Locale } from "@/i18n/routing";
import { localize, localizedPath } from "@/lib/utilities/localize";
import styles from "./page.module.css";

interface ResearchProjectPageProps {
  params: { locale: Locale; slug: string };
}

const projectIcons: Record<ResearchProjectIcon, LucideIcon> = {
  dna: Dna,
  traffic: Route,
  marine: Waves,
  navigation: Navigation,
  code: Code2
};

const methodologyStages = ["research", "development", "validation", "application"] as const;

export function generateStaticParams() {
  return activeResearchProjects.map((project) => ({ slug: project.slug }));
}

export function generateMetadata({ params }: ResearchProjectPageProps): Metadata {
  const project = getActiveResearchProject(params.slug);
  if (!project) return {};
  return {
    title: `${project.name} | SynergyMazeAI`,
    description: localize(project.description, params.locale)
  };
}

export default async function ResearchProjectPage({ params }: ResearchProjectPageProps) {
  const project = getActiveResearchProject(params.slug);
  if (!project) notFound();

  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "research.detail" });
  const Icon = projectIcons[project.icon];
  const relatedProjects = activeResearchProjects.filter(({ slug }) => slug !== project.slug);

  return (
    <article className={styles.page} data-tone={project.tone}>
      <header className={styles.projectHeader}>
        <TechnicalDetail variant="grid" className={styles.headerGrid} />
        <Container>
          <Link className={styles.backLink} href={localizedPath(params.locale, "/research/projects")}>
            <ArrowLeft size={18} aria-hidden="true" />
            {localize(researchPageCopy.back, params.locale)}
          </Link>
          <div className={styles.headerLayout}>
            <div className={styles.headerContent}>
              <TechnicalLabel>{localize(researchPageCopy.active, params.locale)}</TechnicalLabel>
              <p className={styles.projectCategory}>{localize(project.category, params.locale)}</p>
              <h1>{project.name}</h1>
              <p className={styles.projectDescription}>{localize(project.description, params.locale)}</p>
            </div>
            <ProjectTechnicalVisual
              Icon={Icon}
              category={localize(project.category, params.locale)}
              program={project.type}
              ariaLabel={t("visualAriaLabel", { project: project.name })}
            />
          </div>
        </Container>
      </header>

      <section className={styles.documentSection} aria-labelledby="project-overview-heading">
        <Container className={styles.documentLayout}>
          <SectionIndex number="01" label={t("overview.eyebrow")} />
          <div className={styles.documentContent}>
            <h2 id="project-overview-heading">{t("overview.title")}</h2>
            <p className={styles.editorialLead}>{t("overview.question")}</p>
            <p>{localize(project.description, params.locale)}</p>
            <dl className={styles.inlineMetadata}>
              <div><dt>{t("labels.field")}</dt><dd>{localize(project.category, params.locale)}</dd></div>
              <div><dt>{t("labels.program")}</dt><dd>{project.type}</dd></div>
            </dl>
          </div>
        </Container>
      </section>

      <section className={styles.documentSectionAlt} aria-labelledby="research-challenge-heading">
        <Container className={styles.documentLayout}>
          <SectionIndex number="02" label={t("challenge.eyebrow")} />
          <div className={styles.documentContent}>
            <h2 id="research-challenge-heading">{t("challenge.title")}</h2>
            <p>{t("challenge.introduction", { project: project.name })}</p>
            <ul className={styles.objectiveList}>
              {project.objectives.map((objective) => (
                <li key={objective.en}>{localize(objective, params.locale)}</li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className={styles.documentSection} aria-labelledby="research-methodology-heading">
        <Container>
          <div className={styles.sectionHeader}>
            <SectionIndex number="03" label={t("methodology.eyebrow")} />
            <div>
              <h2 id="research-methodology-heading">{t("methodology.title")}</h2>
              <p>{t("methodology.description")}</p>
            </div>
          </div>
          <ol className={styles.methodology}>
            {methodologyStages.map((stage, index) => (
              <li key={stage}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h3>{t(`methodology.stages.${stage}.title`)}</h3>
                <p>{t(`methodology.stages.${stage}.description`)}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className={styles.documentSectionAlt} aria-labelledby="technology-heading">
        <Container className={styles.documentLayout}>
          <SectionIndex number="04" label={t("technology.eyebrow")} />
          <div className={styles.documentContent}>
            <h2 id="technology-heading">{t("technology.title")}</h2>
            <div className={styles.specificationPanel}>
              <dl>
                <div><dt>{t("labels.field")}</dt><dd>{localize(project.category, params.locale)}</dd></div>
                <div><dt>{t("labels.program")}</dt><dd>{project.type}</dd></div>
                <div><dt>{t("labels.status")}</dt><dd>{localize(researchPageCopy.active, params.locale)}</dd></div>
              </dl>
              <div className={styles.technologyStack}>
                <h3>{t("technology.stack")}</h3>
                <ul>{project.technologies.map((technology) => <li key={technology}>{technology}</li>)}</ul>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className={styles.statusSection} aria-labelledby="research-status-heading">
        <Container className={styles.statusPanel}>
          <TechnicalDetail variant="circuit" className={styles.statusCircuit} />
          <div>
            <TechnicalLabel index="05">{t("status.eyebrow")}</TechnicalLabel>
            <h2 id="research-status-heading">{t("status.title")}</h2>
            <p>{t("status.description", { project: project.name })}</p>
          </div>
          <span className={styles.statusValue}>{localize(researchPageCopy.active, params.locale)}</span>
        </Container>
      </section>

      <section className={styles.relatedSection} aria-labelledby="related-projects-heading">
        <Container>
          <div className={styles.sectionHeader}>
            <SectionIndex number="06" label={t("related.eyebrow")} />
            <div>
              <h2 id="related-projects-heading">{t("related.title")}</h2>
              <p>{t("related.description")}</p>
            </div>
          </div>
          <nav className={styles.relatedProjects} aria-labelledby="related-projects-heading">
            {relatedProjects.map((relatedProject, index) => (
              <Link href={localizedPath(params.locale, `/research/projects/${relatedProject.slug}`)} key={relatedProject.slug}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <strong>{relatedProject.name}</strong>
                <small>{localize(relatedProject.category, params.locale)}</small>
                <ArrowUpRight className={styles.directionalIcon} size={18} aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </Container>
      </section>

      <section className={styles.collaborationSection} aria-labelledby="project-collaboration-heading">
        <Container className={styles.collaborationPanel}>
          <TechnicalDetail variant="mazeCorner" className={styles.collaborationCorner} />
          <div>
            <TechnicalLabel>{t("collaboration.eyebrow")}</TechnicalLabel>
            <h2 id="project-collaboration-heading">{t("collaboration.title")}</h2>
            <p>{t("collaboration.description")}</p>
          </div>
          <div className={styles.collaborationActions}>
            <Button href={localizedPath(params.locale, "/research/partnerships")}>
              {t("collaboration.partnerships")}
              <ArrowUpRight className={styles.directionalIcon} size={18} aria-hidden="true" />
            </Button>
            <Button href={localizedPath(params.locale, "/contact")} variant="outline">
              {t("collaboration.contact")}
            </Button>
          </div>
        </Container>
      </section>
    </article>
  );
}

function SectionIndex({ number, label }: { number: string; label: string }) {
  return <div className={styles.sectionIndex}><span>{number}</span><p>{label}</p></div>;
}

function ProjectTechnicalVisual({ Icon, category, program, ariaLabel }: { Icon: LucideIcon; category: string; program: string; ariaLabel: string }) {
  return (
    <div className={styles.projectVisual} role="img" aria-label={ariaLabel}>
      <div className={styles.visualHeader} aria-hidden="true"><span>R&amp;D / DOCUMENT</span><span>ACTIVE</span></div>
      <div className={styles.visualCore} aria-hidden="true">
        <svg viewBox="0 0 520 320" focusable="false">
          <path className={styles.visualGrid} d="M20 40H500M20 100H500M20 160H500M20 220H500M20 280H500M60 20V300M140 20V300M220 20V300M300 20V300M380 20V300M460 20V300" />
          <path className={styles.visualCircuit} d="M260 160H90V85H42M260 160H145V260H65M260 160H405V80H480M260 160H440V245H500" />
          <circle className={styles.visualNode} cx="42" cy="85" r="5" /><circle className={styles.visualNode} cx="65" cy="260" r="5" />
          <circle className={styles.visualNode} cx="480" cy="80" r="5" /><circle className={styles.visualNode} cx="500" cy="245" r="5" />
        </svg>
        <span className={styles.visualIcon}><Icon size={58} strokeWidth={1.3} /></span>
      </div>
      <div className={styles.visualMetadata} aria-hidden="true"><span>{category}</span><span>{program}</span></div>
    </div>
  );
}
