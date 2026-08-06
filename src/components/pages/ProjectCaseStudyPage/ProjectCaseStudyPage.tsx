import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import type { WebDevelopmentProject } from "@/data/web-development-projects";
import { projectPageCopy } from "@/data/web-development-projects";
import type { Locale } from "@/i18n/routing";
import { localizedPath, localize } from "@/lib/utilities/localize";
import styles from "./ProjectCaseStudyPage.module.css";

interface ProjectCaseStudyPageProps {
  locale: Locale;
  project: WebDevelopmentProject;
}

interface ProjectSectionProps {
  eyebrow: string;
  title: string;
  items: WebDevelopmentProject["features"];
  locale: Locale;
  ordered?: boolean;
}

function ProjectSection({ eyebrow, title, items, locale, ordered }: ProjectSectionProps) {
  const List = ordered ? "ol" : "ul";

  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.sectionHeading}>
          <p>{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <List className={ordered ? styles.numberedGrid : styles.itemGrid}>
          {items.map((item, index) => (
            <li key={localize(item.title, locale)}>
              <span className={styles.itemMarker} aria-hidden="true">
                {ordered ? String(index + 1).padStart(2, "0") : <CircleDot size={18} />}
              </span>
              <div>
                <h3>{localize(item.title, locale)}</h3>
                <p>{localize(item.description, locale)}</p>
              </div>
            </li>
          ))}
        </List>
      </Container>
    </section>
  );
}

export function ProjectCaseStudyPage({ locale, project }: ProjectCaseStudyPageProps) {
  return (
    <article>
      <section className={styles.hero}>
        <Container>
          <Link
            className={styles.backLink}
            href={localizedPath(locale, "/services/web-development")}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            {localize(projectPageCopy.back, locale)}
          </Link>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <Badge>{localize(projectPageCopy.portfolioProject, locale)}</Badge>
              <h1>{localize(project.title, locale)}</h1>
              <p className={styles.lead}>{localize(project.overview, locale)}</p>
              <div className={styles.status}>
                <CheckCircle2 size={19} aria-hidden="true" />
                <div>
                  <strong>{localize(projectPageCopy.status, locale)}</strong>
                  <p>{localize(project.status, locale)}</p>
                </div>
              </div>
            </div>
            <div className={styles.heroMedia}>
              <Image
                className={styles.heroImage}
                src={project.image}
                alt={`${localize(project.title, locale)} project dashboard`}
                fill
                priority
                sizes="(min-width: 980px) 54vw, 100vw"
              />
            </div>
          </div>
        </Container>
      </section>

      <section className={styles.problemSection}>
        <Container className={styles.problemGrid}>
          <div className={styles.sectionHeading}>
            <p>01</p>
            <h2>{localize(projectPageCopy.problem, locale)}</h2>
          </div>
          <p className={styles.problemText}>{localize(project.problem, locale)}</p>
        </Container>
      </section>

      <ProjectSection
        eyebrow="02"
        title={localize(projectPageCopy.stack, locale)}
        items={project.stack}
        locale={locale}
      />
      <ProjectSection
        eyebrow="03"
        title={localize(projectPageCopy.features, locale)}
        items={project.features}
        locale={locale}
        ordered
      />
      <ProjectSection
        eyebrow="04"
        title={localize(projectPageCopy.architecture, locale)}
        items={project.architecture}
        locale={locale}
      />
      <ProjectSection
        eyebrow="05"
        title={localize(projectPageCopy.process, locale)}
        items={project.process}
        locale={locale}
        ordered
      />
      <ProjectSection
        eyebrow="06"
        title={localize(projectPageCopy.deployment, locale)}
        items={project.deployment}
        locale={locale}
      />
      <ProjectSection
        eyebrow="07"
        title={localize(projectPageCopy.challenges, locale)}
        items={project.challenges}
        locale={locale}
      />
      <ProjectSection
        eyebrow="08"
        title={localize(projectPageCopy.quality, locale)}
        items={project.quality}
        locale={locale}
      />

      <section className={styles.section}>
        <Container className={styles.maintenanceGrid}>
          <div className={styles.sectionHeading}>
            <p>09</p>
            <h2>{localize(projectPageCopy.maintenance, locale)}</h2>
          </div>
          <p className={styles.problemText}>{localize(project.maintenance, locale)}</p>
        </Container>
      </section>

      <ProjectSection
        eyebrow="10"
        title={localize(projectPageCopy.roadmap, locale)}
        items={project.roadmap}
        locale={locale}
        ordered
      />

      <section className={styles.linksSection}>
        <Container>
          <div className={styles.sectionHeading}>
            <p>11</p>
            <h2>{localize(projectPageCopy.links, locale)}</h2>
          </div>
          <div className={styles.linkGrid}>
            {project.links.map((projectLink) =>
              projectLink.href ? (
                <a
                  href={projectLink.href}
                  key={localize(projectLink.label, locale)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>{localize(projectLink.label, locale)}</strong>
                  <ArrowUpRight size={19} aria-hidden="true" />
                </a>
              ) : (
                <div key={localize(projectLink.label, locale)}>
                  <strong>{localize(projectLink.label, locale)}</strong>
                  <span>{localize(projectPageCopy.unavailable, locale)}</span>
                </div>
              )
            )}
          </div>
        </Container>
      </section>
    </article>
  );
}
