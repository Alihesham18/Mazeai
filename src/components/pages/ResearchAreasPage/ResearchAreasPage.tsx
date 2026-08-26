import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Eye,
  FlaskConical,
  Network,
  type LucideIcon
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { TechnicalDetail, TechnicalLabel } from "@/components/ui/TechnicalDetail";
import { activeResearchProjects } from "@/data/active-research-projects";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import {
  InteractiveIllumination,
  MobileResearchAreas,
  type ResearchAreaItem
} from "./ResearchAreasInteractive";
import styles from "./ResearchAreasPage.module.css";

const domains = [
  { key: "machineLearning", number: "01", code: "ML", icon: "brain", Icon: BrainCircuit },
  { key: "computerVision", number: "02", code: "CV", icon: "eye", Icon: Eye },
  { key: "aiSystems", number: "03", code: "AIS", icon: "network", Icon: Network },
  { key: "appliedAI", number: "04", code: "AAI", icon: "flask", Icon: FlaskConical }
] as const satisfies readonly {
  key: string;
  number: string;
  code: string;
  icon: ResearchAreaItem["icon"];
  Icon: LucideIcon;
}[];

const domainTags = ["one", "two", "three"] as const;
const methodologyStages = ["discover", "develop", "validate", "apply"] as const;
const technologies = [
  "machineLearning",
  "deepLearning",
  "computerVision",
  "naturalLanguageProcessing",
  "reinforcementLearning",
  "dataScience",
  "aiAutomation",
  "researchEngineering"
] as const;

export async function ResearchAreasPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "research.areas" });
  const researchAreas: ResearchAreaItem[] = domains.map(({ key, number, code, icon }) => ({
    number,
    code,
    icon,
    title: t(`domains.items.${key}.title`),
    description: t(`domains.items.${key}.description`),
    focusLabel: t("domains.focusLabel", { domain: t(`domains.items.${key}.title`) }),
    tags: domainTags.map((tag) => t(`domains.items.${key}.tags.${tag}`))
  }));
  const metrics = [
    { key: "areas", value: String(domains.length).padStart(2, "0") },
    { key: "projects", value: String(activeResearchProjects.length).padStart(2, "0") },
    { key: "method", value: t("metrics.method.value") },
    { key: "partnerships", value: t("metrics.partnerships.value") }
  ] as const;

  return (
    <div className={styles.page}>
      <InteractiveIllumination
        className={styles.hero}
        variant="hero"
        aria-labelledby="research-areas-title"
      >
        <TechnicalDetail variant="grid" className={styles.heroGrid} />
        <div className={styles.heroImageLayer}>
          <Image
            src="/images/research/research-hero-brain.webp"
            alt={t("hero.imageAlt")}
            fill
            priority
            sizes="100vw"
            quality={94}
            className={styles.heroImage}
          />
        </div>
        <div className={styles.heroScrim} aria-hidden="true" />
        <Container className={styles.heroContainer}>
          <nav className={styles.breadcrumbs} aria-label={t("hero.breadcrumb.label")}>
            <Link href={localizedPath(locale, "/research")}>{t("hero.breadcrumb.research")}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{t("hero.breadcrumb.current")}</span>
          </nav>
          <div className={styles.heroCopy}>
            <TechnicalLabel>{t("overline")}</TechnicalLabel>
            <h1 id="research-areas-title">{t("title")}</h1>
            <p className={styles.heroStatement}>{t("hero.statement")}</p>
            <p className={styles.heroDescription}>{t("description")}</p>
            <Button
              href={localizedPath(locale, "/research/projects")}
              className={styles.heroAction}
            >
              {t("hero.action")}
              <ArrowUpRight className={styles.directionalIcon} size={18} aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </InteractiveIllumination>

      <section className={styles.metricsSection} aria-label={t("metrics.label")}>
        <Container>
          <dl className={styles.metrics}>
            {metrics.map(({ key, value }, index) => (
              <div key={key}>
                <dt>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  {t(`metrics.${key}.label`)}
                </dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className={styles.domainsSection} aria-labelledby="research-domains-heading">
        <Container>
          <SectionIntroduction
            eyebrow={t("domains.eyebrow")}
            title={t("domains.title")}
            description={t("domains.description")}
            headingId="research-domains-heading"
          />
          <div className={styles.domainGrid} data-testid="research-area-grid">
            {domains.map(({ key, number, code, Icon }) => (
              <article className={styles.domainCard} key={key}>
                <span className={styles.cardEdge} aria-hidden="true" />
                <div className={styles.domainCardHeader}>
                  <span className={styles.domainNumber} aria-hidden="true">
                    {number}
                  </span>
                  <Icon size={29} strokeWidth={1.35} aria-hidden="true" />
                </div>
                <span className={styles.domainCode} aria-hidden="true">
                  R&amp;D / {code}
                </span>
                <h3>{t(`domains.items.${key}.title`)}</h3>
                <p>{t(`domains.items.${key}.description`)}</p>
                <ul
                  aria-label={t("domains.focusLabel", { domain: t(`domains.items.${key}.title`) })}
                >
                  {domainTags.map((tag) => (
                    <li key={tag}>{t(`domains.items.${key}.tags.${tag}`)}</li>
                  ))}
                </ul>
                <ArrowRight className={styles.cardArrow} size={18} aria-hidden="true" />
              </article>
            ))}
          </div>
          <MobileResearchAreas items={researchAreas} listLabel={t("domains.mobileListLabel")} />
        </Container>
      </section>

      <section className={styles.methodologySection} aria-labelledby="research-methodology-heading">
        <TechnicalDetail variant="dots" className={styles.methodologyDots} />
        <Container>
          <SectionIntroduction
            eyebrow={t("methodology.eyebrow")}
            title={t("methodology.title")}
            description={t("methodology.description")}
            headingId="research-methodology-heading"
          />
          <ol className={styles.timeline}>
            {methodologyStages.map((stage, index) => (
              <li key={stage}>
                <span className={styles.timelineMarker} aria-hidden="true" />
                <span className={styles.timelineNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{t(`methodology.stages.${stage}.title`)}</h3>
                <p>{t(`methodology.stages.${stage}.description`)}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className={styles.technologySection} aria-labelledby="technology-stack-heading">
        <Container className={styles.technologyLayout}>
          <SectionIntroduction
            eyebrow={t("technology.eyebrow")}
            title={t("technology.title")}
            description={t("technology.description")}
            headingId="technology-stack-heading"
          />
          <div className={styles.technologyConsole}>
            <div className={styles.consoleHeader} aria-hidden="true">
              <span>R&amp;D / STACK</span>
              <span>{t("technology.consoleStatus")}</span>
            </div>
            <ul>
              {technologies.map((technology, index) => (
                <li key={technology}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <strong>{t(`technology.items.${technology}`)}</strong>
                  <span className={styles.consoleNode} aria-hidden="true" />
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <InteractiveIllumination
        className={styles.impactSection}
        variant="impact"
        aria-labelledby="research-impact-heading"
      >
        <div className={styles.impactImageLayer}>
          <Image
            src="/images/research/research-partnership-map.webp"
            alt={t("impact.imageAlt")}
            fill
            sizes="100vw"
            quality={92}
            className={styles.impactImage}
          />
        </div>
        <div className={styles.impactScrim} aria-hidden="true" />
        <Container className={styles.impactContainer}>
          <div className={styles.impactCopy}>
            <TechnicalLabel>{t("impact.eyebrow")}</TechnicalLabel>
            <h2 id="research-impact-heading">{t("impact.title")}</h2>
            <p>{t("impact.description")}</p>
            <Button href={localizedPath(locale, "/research/partnerships")}>
              {t("impact.action")}
              <ArrowUpRight className={styles.directionalIcon} size={18} aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </InteractiveIllumination>
    </div>
  );
}

function SectionIntroduction({
  eyebrow,
  title,
  description,
  headingId
}: {
  eyebrow: string;
  title: string;
  description: string;
  headingId: string;
}) {
  return (
    <div className={styles.sectionIntroduction}>
      <TechnicalLabel>{eyebrow}</TechnicalLabel>
      <div>
        <h2 id={headingId}>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}
