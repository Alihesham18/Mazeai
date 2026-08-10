import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Code2,
  Dna,
  Navigation,
  Route,
  UserRound,
  Waves,
  type LucideIcon
} from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
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
  params: {
    locale: Locale;
    slug: string;
  };
}

const projectIcons: Record<ResearchProjectIcon, LucideIcon> = {
  dna: Dna,
  traffic: Route,
  marine: Waves,
  navigation: Navigation,
  code: Code2
};

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

export default function ResearchProjectPage({ params }: ResearchProjectPageProps) {
  const project = getActiveResearchProject(params.slug);

  if (!project) notFound();

  setRequestLocale(params.locale);
  const Icon = projectIcons[project.icon];

  return (
    <article className={styles.page} data-tone={project.tone}>
      <header className={styles.hero}>
        <Container>
          <Link className={styles.backLink} href={localizedPath(params.locale, "/research")}>
            <ArrowLeft size={18} aria-hidden="true" />
            {localize(researchPageCopy.back, params.locale)}
          </Link>

          <div className={styles.heroGrid}>
            <div>
              <p className={styles.status}>{localize(researchPageCopy.active, params.locale)}</p>
              <h1>{project.name}</h1>
              <p className={styles.metaLine}>
                {localize(project.category, params.locale)} · {project.type}
              </p>
            </div>
            <div className={styles.projectMark} aria-hidden="true">
              <Icon size={58} strokeWidth={1.35} />
            </div>
          </div>
        </Container>
      </header>

      <section className={styles.section} aria-labelledby="project-overview-heading">
        <Container className={styles.splitSection}>
          <div className={styles.sectionHeading}>
            <p>01</p>
            <h2 id="project-overview-heading">
              {localize(researchPageCopy.descriptionTitle, params.locale)}
            </h2>
          </div>
          <div>
            <p className={styles.description}>{localize(project.description, params.locale)}</p>
            <dl className={styles.metadata}>
              <div>
                <dt>{localize(researchPageCopy.category, params.locale)}</dt>
                <dd>{localize(project.category, params.locale)}</dd>
              </div>
              <div>
                <dt>{localize(researchPageCopy.type, params.locale)}</dt>
                <dd>{project.type}</dd>
              </div>
            </dl>
          </div>
        </Container>
      </section>

      <section className={styles.sectionAlt} aria-labelledby="project-objectives-heading">
        <Container>
          <div className={styles.sectionHeading}>
            <p>02</p>
            <h2 id="project-objectives-heading">
              {localize(researchPageCopy.objectivesTitle, params.locale)}
            </h2>
          </div>
          <ul className={styles.objectives}>
            {project.objectives.map((objective) => (
              <li key={objective.en}>
                <Check size={19} aria-hidden="true" />
                <span>{localize(objective, params.locale)}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className={styles.section} aria-labelledby="project-technologies-heading">
        <Container>
          <div className={styles.sectionHeading}>
            <p>03</p>
            <h2 id="project-technologies-heading">
              {localize(researchPageCopy.technologiesTitle, params.locale)}
            </h2>
          </div>
          <ul className={styles.technologies}>
            {project.technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
        </Container>
      </section>

      {project.teamSlots > 0 ? (
        <section className={styles.sectionAlt} aria-labelledby="project-team-heading">
          <Container>
            <div className={styles.sectionHeading}>
              <p>04</p>
              <h2 id="project-team-heading">
                {localize(researchPageCopy.teamTitle, params.locale)}
              </h2>
              <span>{localize(researchPageCopy.teamDescription, params.locale)}</span>
            </div>
            <div className={styles.teamGrid}>
              {Array.from({ length: project.teamSlots }, (_, slotIndex) => (
                <div
                  className={styles.teamSlot}
                  aria-label={`${localize(researchPageCopy.unassigned, params.locale)} ${slotIndex + 1}`}
                  key={slotIndex}
                >
                  <span className={styles.emptyAvatar} aria-hidden="true">
                    <UserRound size={30} strokeWidth={1.4} />
                  </span>
                  <span className={styles.emptyName} aria-hidden="true" />
                  <span className={styles.emptyRole} aria-hidden="true" />
                </div>
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </article>
  );
}
