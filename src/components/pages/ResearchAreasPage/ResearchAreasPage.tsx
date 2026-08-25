import {
  ArrowUpRight,
  BrainCircuit,
  Eye,
  FlaskConical,
  Network,
  type LucideIcon
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { TechnicalDetail, TechnicalLabel } from "@/components/ui/TechnicalDetail";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./ResearchAreasPage.module.css";

const domains = [
  { key: "machineLearning", number: "01", code: "ML", Icon: BrainCircuit },
  { key: "computerVision", number: "02", code: "CV", Icon: Eye },
  { key: "aiSystems", number: "03", code: "AIS", Icon: Network },
  { key: "appliedAI", number: "04", code: "AAI", Icon: FlaskConical }
] as const;

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

  return (
    <div className={styles.page}>
      <section className={styles.researchHeader} aria-labelledby="research-areas-title">
        <TechnicalDetail variant="grid" className={styles.headerGrid} />
        <Container className={styles.headerContainer}>
          <div className={styles.headerBar}>
            <TechnicalLabel>{t("overline")}</TechnicalLabel>
            <span>{t("header.registry")}</span>
          </div>
          <div className={styles.headerCopy}>
            <h1 id="research-areas-title">{t("title")}</h1>
            <div className={styles.headerDescription}>
              <TechnicalDetail variant="circuit" />
              <p>{t("description")}</p>
            </div>
          </div>
          <DomainSignal ariaLabel={t("header.visualAriaLabel")} />
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
          <div className={styles.domainRegistry}>
            {domains.map(({ key, number, code, Icon }) => (
              <article className={styles.domainModule} key={key}>
                <div className={styles.domainIdentity}>
                  <span className={styles.domainNumber} aria-hidden="true">{number}</span>
                  <span className={styles.domainCode} aria-hidden="true">{code}</span>
                  <Icon size={28} strokeWidth={1.35} aria-hidden="true" />
                </div>
                <div className={styles.domainTitle}>
                  <TechnicalLabel index={number}>{t("domains.domainLabel")}</TechnicalLabel>
                  <h3>{t(`domains.items.${key}.title`)}</h3>
                </div>
                <p className={styles.domainDescription}>{t(`domains.items.${key}.description`)}</p>
                <ul className={styles.domainTags} aria-label={t("domains.focusLabel", { domain: t(`domains.items.${key}.title`) })}>
                  {domainTags.map((tag) => <li key={tag}>{t(`domains.items.${key}.tags.${tag}`)}</li>)}
                </ul>
              </article>
            ))}
          </div>
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
                <span className={styles.timelineNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
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

      <section className={styles.collaborationSection} aria-labelledby="research-areas-collaboration-heading">
        <Container className={styles.collaborationPanel}>
          <TechnicalDetail variant="mazeCorner" className={styles.collaborationCorner} />
          <div>
            <TechnicalLabel>{t("collaboration.eyebrow")}</TechnicalLabel>
            <h2 id="research-areas-collaboration-heading">{t("collaboration.title")}</h2>
            <p>{t("collaboration.description")}</p>
          </div>
          <Button href={localizedPath(locale, "/research/partnerships")}>
            {t("collaboration.action")}
            <ArrowUpRight className={styles.directionalIcon} size={18} aria-hidden="true" />
          </Button>
        </Container>
      </section>
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

function DomainSignal({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div className={styles.domainSignal} role="img" aria-label={ariaLabel}>
      <svg viewBox="0 0 1200 150" focusable="false" aria-hidden="true">
        <path d="M40 75H210L260 28H430L475 75H725L770 122H940L990 75H1160" />
        <circle cx="40" cy="75" r="5" /><circle cx="260" cy="28" r="5" />
        <circle cx="475" cy="75" r="5" /><circle cx="770" cy="122" r="5" />
        <circle cx="990" cy="75" r="5" /><circle cx="1160" cy="75" r="5" />
      </svg>
      <div aria-hidden="true">
        {domains.map(({ number, code }) => <span key={code}><small>{number}</small>{code}</span>)}
      </div>
    </div>
  );
}
