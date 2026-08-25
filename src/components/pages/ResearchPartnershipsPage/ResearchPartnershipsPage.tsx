import {
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  Building2,
  Cpu,
  FlaskConical,
  GraduationCap,
  MessagesSquare,
  Network,
  type LucideIcon
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { TechnicalDetail, TechnicalLabel } from "@/components/ui/TechnicalDetail";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./ResearchPartnershipsPage.module.css";

const audiences = [
  { key: "universities", number: "01", Icon: GraduationCap },
  { key: "researchGroups", number: "02", Icon: FlaskConical },
  { key: "organizations", number: "03", Icon: Building2 },
  { key: "technologyPartners", number: "04", Icon: Cpu }
] as const;

const models = [
  { key: "jointResearch", number: "01", Icon: Network },
  { key: "appliedAI", number: "02", Icon: BrainCircuit },
  { key: "knowledgeExchange", number: "03", Icon: MessagesSquare },
  { key: "education", number: "04", Icon: BookOpen }
] as const;

const scopeItems = [
  "problemFraming",
  "researchPlanning",
  "feasibilityAnalysis",
  "technicalAssessment",
  "prototypeDevelopment",
  "validation",
  "documentation",
  "knowledgeTransfer",
  "recommendations"
] as const;

const processStages = ["discuss", "align", "researchBuild", "review", "continue"] as const;
const ecosystemGroups = ["universities", "researchGroups", "organizations", "technologyOrganizations"] as const;

export async function ResearchPartnershipsPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "research.partnerships" });

  return (
    <div className={styles.page}>
      <section className={styles.collaborationHeader} aria-labelledby="research-partnerships-title">
        <TechnicalDetail variant="grid" className={styles.headerGrid} />
        <Container className={styles.headerContainer}>
          <div className={styles.headerBar}>
            <TechnicalLabel>{t("overline")}</TechnicalLabel>
            <span>{t("header.consoleLabel")}</span>
          </div>
          <div className={styles.headerCopy}>
            <div>
              <h1 id="research-partnerships-title">{t("title")}</h1>
              <p>{t("description")}</p>
            </div>
            <div className={styles.headerActions}>
              <Button href={localizedPath(locale, "/contact")}>
                {t("header.primaryAction")}
                <ArrowUpRight className={styles.directionalIcon} size={18} aria-hidden="true" />
              </Button>
              <Button href={localizedPath(locale, "/research/projects")} variant="outline">
                {t("header.secondaryAction")}
              </Button>
            </div>
          </div>
          <CollaborationMap ariaLabel={t("header.visualAriaLabel")} />
        </Container>
      </section>

      <section className={styles.audiencesSection} aria-labelledby="collaboration-audiences-heading">
        <Container>
          <SectionIntroduction
            eyebrow={t("audiences.eyebrow")}
            title={t("audiences.title")}
            description={t("audiences.description")}
            headingId="collaboration-audiences-heading"
          />
          <div className={styles.audienceGrid}>
            {audiences.map(({ key, number, Icon }) => (
              <article className={styles.audienceModule} key={key}>
                <div className={styles.moduleMarker}>
                  <span aria-hidden="true">{number}</span>
                  <Icon size={27} strokeWidth={1.35} aria-hidden="true" />
                </div>
                <h3>{t(`audiences.items.${key}.title`)}</h3>
                <p>{t(`audiences.items.${key}.description`)}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.modelsSection} aria-labelledby="collaboration-models-heading">
        <TechnicalDetail variant="dots" className={styles.modelsDots} />
        <Container>
          <SectionIntroduction
            eyebrow={t("models.eyebrow")}
            title={t("models.title")}
            description={t("models.description")}
            headingId="collaboration-models-heading"
          />
          <div className={styles.modelRegistry}>
            {models.map(({ key, number, Icon }) => (
              <article className={styles.modelModule} key={key}>
                <span className={styles.modelNumber} aria-hidden="true">{number}</span>
                <Icon size={25} strokeWidth={1.35} aria-hidden="true" />
                <div>
                  <h3>{t(`models.items.${key}.title`)}</h3>
                  <p>{t(`models.items.${key}.description`)}</p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.scopeSection} aria-labelledby="partnership-scope-heading">
        <Container className={styles.scopePanel}>
          <div className={styles.scopeIntroduction}>
            <TechnicalLabel>{t("scope.eyebrow")}</TechnicalLabel>
            <h2 id="partnership-scope-heading">{t("scope.title")}</h2>
            <p>{t("scope.description")}</p>
            <TechnicalDetail variant="circuit" />
          </div>
          <div className={styles.scopeBrief}>
            <div className={styles.briefHeader} aria-hidden="true">
              <span>{t("scope.briefLabel")}</span>
              <span>{t("scope.conditionalLabel")}</span>
            </div>
            <ul aria-label={t("scope.listLabel")}>
              {scopeItems.map((item, index) => (
                <li key={item}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  {t(`scope.items.${item}`)}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className={styles.processSection} aria-labelledby="collaboration-process-heading">
        <Container>
          <SectionIntroduction
            eyebrow={t("process.eyebrow")}
            title={t("process.title")}
            description={t("process.description")}
            headingId="collaboration-process-heading"
          />
          <ol className={styles.processTimeline}>
            {processStages.map((stage, index) => (
              <li key={stage}>
                <span className={styles.processMarker} aria-hidden="true" />
                <span className={styles.processNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h3>{t(`process.stages.${stage}.title`)}</h3>
                <p>{t(`process.stages.${stage}.description`)}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className={styles.ecosystemSection} aria-labelledby="collaboration-ecosystem-heading">
        <Container className={styles.ecosystemLayout}>
          <div>
            <TechnicalLabel>{t("ecosystem.eyebrow")}</TechnicalLabel>
            <h2 id="collaboration-ecosystem-heading">{t("ecosystem.title")}</h2>
            <p>{t("ecosystem.description")}</p>
          </div>
          <ul aria-label={t("ecosystem.listLabel")}>
            {ecosystemGroups.map((group, index) => (
              <li key={group}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                {t(`ecosystem.groups.${group}`)}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className={styles.finalSection} aria-labelledby="partnership-final-heading">
        <Container className={styles.finalPanel}>
          <TechnicalDetail variant="mazeCorner" className={styles.finalCorner} />
          <div>
            <TechnicalLabel>{t("final.eyebrow")}</TechnicalLabel>
            <h2 id="partnership-final-heading">{t("final.title")}</h2>
            <p>{t("final.description")}</p>
          </div>
          <div className={styles.finalActions}>
            <Button href={localizedPath(locale, "/contact")}>
              {t("final.primaryAction")}
              <ArrowUpRight className={styles.directionalIcon} size={18} aria-hidden="true" />
            </Button>
            <Button href={localizedPath(locale, "/research/projects")} variant="outline">
              {t("final.secondaryAction")}
            </Button>
          </div>
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

function CollaborationMap({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div className={styles.collaborationMap} role="img" aria-label={ariaLabel}>
      <svg viewBox="0 0 1200 210" focusable="false" aria-hidden="true">
        <path d="M80 105H255L335 40H490L600 105L710 40H865L945 105H1120" />
        <path d="M335 40V170H490L600 105L710 170H865V40" />
        <circle cx="80" cy="105" r="6" /><circle cx="335" cy="40" r="6" />
        <circle cx="335" cy="170" r="6" /><circle cx="600" cy="105" r="10" />
        <circle cx="865" cy="40" r="6" /><circle cx="865" cy="170" r="6" />
        <circle cx="1120" cy="105" r="6" />
      </svg>
      <div aria-hidden="true">
        {audiences.map(({ number }) => <span key={number}>{number}</span>)}
      </div>
      <strong aria-hidden="true">MazeAI</strong>
    </div>
  );
}
