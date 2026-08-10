import {
  ArrowUpRight,
  Code2,
  Dna,
  Navigation,
  Route,
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
    </>
  );
}
