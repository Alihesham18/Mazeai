import {
  ArrowUpRight,
  Check,
  Code2,
  Dna,
  Navigation,
  Route,
  UserRound,
  Waves,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import {
  activeResearchProjects,
  researchPageCopy,
  type ResearchProjectIcon
} from "@/data/active-research-projects";
import type { Locale } from "@/i18n/routing";
import { localize, localizedPath } from "@/lib/utilities/localize";
import styles from "./ResearchOverviewPage.module.css";

const projectIcons: Record<ResearchProjectIcon, LucideIcon> = {
  dna: Dna,
  traffic: Route,
  marine: Waves,
  navigation: Navigation,
  code: Code2
};

export function ResearchOverviewPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);

  return (
    <>
      <section className={styles.hero}>
        <Container>
          <p className={styles.eyebrow}>{localize(researchPageCopy.eyebrow, locale)}</p>
          <h1>{localize(researchPageCopy.title, locale)}</h1>
          <p className={styles.heroDescription}>{localize(researchPageCopy.description, locale)}</p>
        </Container>
      </section>

      <nav className={styles.directory} aria-labelledby="research-project-directory">
        <Container>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{localize(researchPageCopy.directoryEyebrow, locale)}</p>
            <h2 id="research-project-directory">
              {localize(researchPageCopy.directoryTitle, locale)}
            </h2>
          </div>
          <div className={styles.projectGrid}>
            {activeResearchProjects.map((project) => {
              const Icon = projectIcons[project.icon];

              return (
                <Link
                  className={styles.projectCard}
                  data-tone={project.tone}
                  href={localizedPath(locale, `/research/projects/${project.slug}`)}
                  key={project.slug}
                >
                  <span className={styles.projectVisual} aria-hidden="true">
                    <Icon size={42} strokeWidth={1.6} />
                    <span>{project.name}</span>
                  </span>
                  <span className={styles.projectCardContent}>
                    <span className={styles.status}>
                      {localize(researchPageCopy.active, locale)}
                    </span>
                    <strong>{project.name}</strong>
                    <span>
                      {localize(project.category, locale)} · {project.type}
                    </span>
                    <span className={styles.projectAction}>
                      {localize(researchPageCopy.viewDetails, locale)}
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </Container>
      </nav>

      {activeResearchProjects.map((project, index) => {
        const Icon = projectIcons[project.icon];

        return (
          <article
            className={styles.projectDetail}
            data-tone={project.tone}
            id={project.slug}
            key={project.slug}
          >
            <Container>
              <header className={styles.projectHeader}>
                <div className={styles.detailMark} aria-hidden="true">
                  <Icon size={44} strokeWidth={1.5} />
                </div>
                <div>
                  <p className={styles.projectNumber}>
                    {localize(researchPageCopy.projectLabel, locale)}{" "}
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2>{project.name}</h2>
                  <span className={styles.status}>{localize(researchPageCopy.active, locale)}</span>
                </div>
              </header>

              <div className={styles.projectBody}>
                <section aria-labelledby={`${project.slug}-description`}>
                  <h3 id={`${project.slug}-description`}>
                    {localize(researchPageCopy.descriptionTitle, locale)}
                  </h3>
                  <p className={styles.projectDescription}>
                    {localize(project.description, locale)}
                  </p>
                  <dl className={styles.metadata}>
                    <div>
                      <dt>{localize(researchPageCopy.category, locale)}</dt>
                      <dd>{localize(project.category, locale)}</dd>
                    </div>
                    <div>
                      <dt>{localize(researchPageCopy.type, locale)}</dt>
                      <dd>{project.type}</dd>
                    </div>
                  </dl>
                </section>

                <section aria-labelledby={`${project.slug}-objectives`}>
                  <h3 id={`${project.slug}-objectives`}>
                    {localize(researchPageCopy.objectivesTitle, locale)}
                  </h3>
                  <ul className={styles.objectives}>
                    {project.objectives.map((objective) => (
                      <li key={objective.en}>
                        <Check size={18} aria-hidden="true" />
                        <span>{localize(objective, locale)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <section
                className={styles.technologySection}
                aria-labelledby={`${project.slug}-technologies`}
              >
                <h3 id={`${project.slug}-technologies`}>
                  {localize(researchPageCopy.technologiesTitle, locale)}
                </h3>
                <ul className={styles.technologies}>
                  {project.technologies.map((technology) => (
                    <li key={technology}>{technology}</li>
                  ))}
                </ul>
              </section>

              <section className={styles.teamSection} aria-labelledby={`${project.slug}-team`}>
                <div className={styles.teamHeading}>
                  <p className={styles.eyebrow}>{localize(researchPageCopy.teamEyebrow, locale)}</p>
                  <h3 id={`${project.slug}-team`}>
                    {localize(researchPageCopy.teamTitle, locale)}
                  </h3>
                  <p>{localize(researchPageCopy.teamDescription, locale)}</p>
                </div>
                <div className={styles.teamGrid}>
                  {Array.from({ length: project.teamSlots }, (_, slotIndex) => (
                    <div
                      className={styles.teamSlot}
                      aria-label={`${localize(researchPageCopy.unassigned, locale)} ${slotIndex + 1}`}
                      key={slotIndex}
                    >
                      <span className={styles.emptyAvatar} aria-hidden="true">
                        <UserRound size={32} strokeWidth={1.4} />
                      </span>
                      <span className={styles.emptyName} aria-hidden="true" />
                      <span className={styles.emptyRole} aria-hidden="true" />
                      <span className={styles.visuallyHidden}>
                        {localize(researchPageCopy.unassigned, locale)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </Container>
          </article>
        );
      })}
    </>
  );
}
