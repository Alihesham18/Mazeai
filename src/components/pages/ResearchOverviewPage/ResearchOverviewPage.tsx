import {
  ArrowUpRight,
  BrainCircuit,
  Building2,
  Code2,
  Database,
  Dna,
  Eye,
  GraduationCap,
  Navigation,
  Network,
  Route,
  Waves,
  Workflow,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResearchIntelligenceVisual } from "@/components/research/ResearchIntelligenceVisual";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/Section";
import { TechnicalDetail, TechnicalLabel } from "@/components/ui/TechnicalDetail";
import { activeResearchProjects, type ResearchProjectIcon } from "@/data/active-research-projects";
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

const researchDomains = [
  { key: "machineLearning", number: "01", Icon: BrainCircuit },
  { key: "computerVision", number: "02", Icon: Eye },
  { key: "aiSystems", number: "03", Icon: Workflow },
  { key: "appliedAIResearch", number: "04", Icon: Database }
] as const;

const domainPoints = ["one", "two", "three"] as const;
const approachStages = ["discover", "develop", "validate", "deploy"] as const;
const partnershipGroups = [
  { key: "universities", number: "01", Icon: GraduationCap },
  { key: "organizations", number: "02", Icon: Building2 },
  { key: "collaboration", number: "03", Icon: Network }
] as const;

export async function ResearchOverviewPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "research.overview" });
  const [featuredProject, ...supportingProjects] = activeResearchProjects;

  return (
    <div className={styles.page}>
      <section className={styles.researchHeader} aria-labelledby="research-overview-title">
        <TechnicalDetail variant="grid" className={styles.headerGrid} />
        <Container className={styles.headerContainer}>
          <div className={styles.headerIntroduction}>
            <div className={styles.headerTitle}>
              <TechnicalLabel>{t("header.eyebrow")}</TechnicalLabel>
              <h1 id="research-overview-title">{t("header.title")}</h1>
            </div>
            <div className={styles.headerSummary}>
              <TechnicalDetail variant="line" />
              <p>{t("header.description")}</p>
            </div>
          </div>
          <dl className={styles.researchMetadata}>
            {(["program", "mode", "portfolio"] as const).map((item, index) => (
              <div key={item}>
                <dt>{String(index + 1).padStart(2, "0")} / {t(`header.metadata.${item}.label`)}</dt>
                <dd>{t(`header.metadata.${item}.value`)}</dd>
              </div>
            ))}
          </dl>
          <ResearchIntelligenceVisual
            ariaLabel={t("visual.ariaLabel")}
            coreLabel={t("visual.core")}
            signalLabel={t("visual.signal")}
            modelLabel={t("visual.model")}
          />
        </Container>
      </section>

      <section className={styles.domains} aria-labelledby="research-domains-title">
        <Container>
          <SectionHeading
            eyebrow={t("domains.eyebrow")}
            title={<span id="research-domains-title">{t("domains.title")}</span>}
            description={t("domains.description")}
          />
          <div className={styles.domainGrid}>
            {researchDomains.map(({ key, number, Icon }) => (
              <Card className={styles.domainCard} interactive variant="technical" key={key}>
                <div className={styles.domainHeader}>
                  <span className={styles.domainNumber} aria-hidden="true">{number}</span>
                  <Icon size={27} strokeWidth={1.45} aria-hidden="true" />
                </div>
                <h3>{t(`domains.items.${key}.title`)}</h3>
                <ul>
                  {domainPoints.map((point) => (
                    <li key={point}>{t(`domains.items.${key}.points.${point}`)}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.projects} aria-labelledby="featured-research-title">
        <Container>
          <SectionHeading
            eyebrow={t("projects.eyebrow")}
            title={<span id="featured-research-title">{t("projects.title")}</span>}
            description={t("projects.description")}
          />
          <div className={styles.projectLayout}>
            <Card className={styles.featuredProject} variant="featured" interactive data-featured="true">
              <ProjectCardContent
                project={featuredProject}
                locale={locale}
                label={t("projects.featuredLabel")}
                action={t("projects.viewProject", { project: featuredProject.name })}
                featured
              />
            </Card>
            <div className={styles.supportingProjects}>
              {supportingProjects.map((project, index) => (
                <Card className={styles.supportingProject} interactive key={project.slug}>
                  <ProjectCardContent
                    project={project}
                    locale={locale}
                    label={`${String(index + 2).padStart(2, "0")} / ${t("projects.projectLabel")}`}
                    action={t("projects.viewProject", { project: project.name })}
                  />
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className={styles.approach} aria-labelledby="research-approach-title">
        <Container>
          <SectionHeading
            eyebrow={t("approach.eyebrow")}
            title={<span id="research-approach-title">{t("approach.title")}</span>}
            description={t("approach.description")}
          />
          <ol className={styles.timeline}>
            {approachStages.map((stage, index) => (
              <li className={styles.timelineStage} key={stage}>
                <span className={styles.timelineMarker} aria-hidden="true" />
                <span className={styles.timelineNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{t(`approach.stages.${stage}.title`)}</h3>
                <p>{t(`approach.stages.${stage}.description`)}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className={styles.partnerships} aria-labelledby="research-partnership-title">
        <Container>
          <SectionHeading
            eyebrow={t("partnerships.eyebrow")}
            title={<span id="research-partnership-title">{t("partnerships.title")}</span>}
            description={t("partnerships.description")}
          />
          <div className={styles.partnershipGrid}>
            {partnershipGroups.map(({ key, number, Icon }) => (
              <Card className={styles.partnershipCard} variant="technical" key={key}>
                <div className={styles.partnershipMarker}>
                  <span aria-hidden="true">{number}</span>
                  <Icon size={25} strokeWidth={1.4} aria-hidden="true" />
                </div>
                <h3>{t(`partnerships.groups.${key}.title`)}</h3>
                <p>{t(`partnerships.groups.${key}.description`)}</p>
              </Card>
            ))}
          </div>
          <div className={styles.partnershipActions}>
            <Button href={localizedPath(locale, "/research/partnerships")}>
              {t("partnerships.action")}
              <ArrowUpRight className={styles.directionalIcon} size={18} aria-hidden="true" />
            </Button>
            <Button href={localizedPath(locale, "/contact")} variant="outline">
              {t("partnerships.contact")}
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}

function ProjectCardContent({
  project,
  locale,
  label,
  action,
  featured = false
}: {
  project: (typeof activeResearchProjects)[number];
  locale: Locale;
  label: string;
  action: string;
  featured?: boolean;
}) {
  const Icon = projectIcons[project.icon];

  return (
    <div className={styles.projectContent} data-size={featured ? "featured" : "supporting"}>
      <div className={styles.projectMeta}>
        <span>{label}</span>
        <Icon size={featured ? 34 : 25} strokeWidth={1.45} aria-hidden="true" />
      </div>
      <p className={styles.projectCategory}>{localize(project.category, locale)}</p>
      <h3>{project.name}</h3>
      <p className={styles.projectDescription}>{localize(project.description, locale)}</p>
      <Link className={styles.projectLink} href={localizedPath(locale, `/research/projects/${project.slug}`)}>
        {action}
        <ArrowUpRight className={styles.directionalIcon} size={17} aria-hidden="true" />
      </Link>
    </div>
  );
}
