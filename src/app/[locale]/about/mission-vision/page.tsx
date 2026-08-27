import {
  ArrowRight,
  Atom,
  BookOpen,
  BrainCircuit,
  Building2,
  FlaskConical,
  GraduationCap,
  Handshake,
  Lightbulb,
  Network,
  Orbit,
  Rocket,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { createPageMetadata, type StandalonePageConfig } from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./mission-vision.module.css";

interface MissionVisionPageProps {
  params: {
    locale: Locale;
  };
}

const page: StandalonePageConfig = {
  path: "about/mission-vision",
  titleKey: "pages.missionVision.title",
  descriptionKey: "pages.missionVision.description",
  sections: ["Mission", "Vision", "Principles", "Research to impact", "Who we support"]
};

const principleIcons = [Lightbulb, ShieldCheck, UsersRound, BookOpen] as const;
const principleAccents = ["gold", "violet", "violet", "gold"] as const;
const principleKeys = [
  "practicalImpact",
  "responsibleInnovation",
  "collaboration",
  "continuousLearning"
] as const;
const processIcons = [FlaskConical, Atom, BrainCircuit, Rocket, GraduationCap] as const;
const processKeys = [
  "research",
  "experimentation",
  "development",
  "implementation",
  "learning"
] as const;
const audienceIcons = [Building2, Network, GraduationCap, Handshake] as const;
const audienceKeys = ["organizations", "researchers", "educators", "communities"] as const;

export const generateMetadata = createPageMetadata(page);

export default async function MissionVisionPage({ params }: MissionVisionPageProps) {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "pages.missionVision"
  });

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="mission-vision-heading">
        <div className={styles.heroMedia} aria-hidden="true">
          <Image
            className={`${styles.themeImage} ${styles.lightImage}`}
            src="/images/about/about-hero-light.png"
            alt=""
            fill
            priority
            quality={94}
            sizes="100vw"
          />
          <Image
            className={`${styles.themeImage} ${styles.darkImage}`}
            src="/images/about/about-hero-dark.png"
            alt=""
            fill
            priority
            quality={94}
            sizes="100vw"
          />
        </div>
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroGrid} aria-hidden="true" />

        <div className={`${styles.container} ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{t("hero.eyebrow")}</p>
            <h1 id="mission-vision-heading">{t("hero.title")}</h1>
            <p className={styles.heroIntro}>{t("hero.intro")}</p>
          </div>
        </div>
      </section>

      <section className={styles.intentSection} aria-label={t("intentAriaLabel")}>
        <div className={`${styles.container} ${styles.intentGrid}`}>
          <article className={styles.intentPanel} data-accent="gold">
            <div className={styles.intentHeader}>
              <p className={styles.sectionLabel}>{t("mission.label")}</p>
              <span className={styles.intentIcon} aria-hidden="true">
                <Orbit />
              </span>
            </div>
            <h2>{t("mission.statement")}</h2>
            <span className={styles.accentRule} aria-hidden="true" />
            <div className={styles.intentBody}>
              <p>{t("mission.paragraphOne")}</p>
              <p>{t("mission.paragraphTwo")}</p>
              <p>{t("mission.paragraphThree")}</p>
            </div>
          </article>

          <article className={styles.intentPanel} data-accent="violet">
            <div className={styles.intentHeader}>
              <p className={styles.sectionLabel}>{t("vision.label")}</p>
              <span className={styles.intentIcon} aria-hidden="true">
                <Sparkles />
              </span>
            </div>
            <h2>{t("vision.statement")}</h2>
            <span className={styles.accentRule} aria-hidden="true" />
            <div className={styles.intentBody}>
              <p>{t("vision.paragraphOne")}</p>
              <p>{t("vision.paragraphTwo")}</p>
              <p>{t("vision.paragraphThree")}</p>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.principlesSection} aria-labelledby="principles-heading">
        <div className={styles.container}>
          <header className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>{t("principles.label")}</p>
            <h2 id="principles-heading">{t("principles.title")}</h2>
          </header>

          <div className={styles.principlesGrid}>
            {principleIcons.map((Icon, index) => {
              const number = String(index + 1).padStart(2, "0");
              const key = `principles.items.${principleKeys[index]}`;

              return (
                <article
                  className={styles.principleCard}
                  data-accent={principleAccents[index]}
                  key={number}
                >
                  <div className={styles.cardMeta}>
                    <span>{number}</span>
                    <Icon aria-hidden="true" />
                  </div>
                  <h3>{t(`${key}.title`)}</h3>
                  <p>{t(`${key}.description`)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.processSection} aria-labelledby="process-heading">
        <div className={styles.container}>
          <div className={styles.processIntro}>
            <header className={styles.sectionHeader}>
              <p className={styles.sectionLabel}>{t("process.eyebrow")}</p>
              <h2 id="process-heading">{t("process.title")}</h2>
            </header>
            <div className={styles.processCopy}>
              <p>{t("process.paragraphOne")}</p>
              <p>{t("process.paragraphTwo")}</p>
              <p>{t("process.paragraphThree")}</p>
            </div>
          </div>

          <ol className={styles.processFlow} aria-label={t("process.flowAriaLabel")}>
            {processIcons.map((Icon, index) => {
              const number = String(index + 1).padStart(2, "0");
              const key = `process.steps.${processKeys[index]}`;

              return (
                <li className={styles.processStep} key={number}>
                  <div className={styles.processNode}>
                    <Icon aria-hidden="true" />
                  </div>
                  <span className={styles.stepNumber}>{number}</span>
                  <h3>{t(`${key}.title`)}</h3>
                  <p>{t(`${key}.description`)}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className={styles.supportSection} aria-labelledby="support-heading">
        <div className={styles.container}>
          <header className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>{t("support.eyebrow")}</p>
            <h2 id="support-heading">{t("support.title")}</h2>
          </header>

          <div className={styles.supportGrid}>
            {audienceIcons.map((Icon, index) => (
              <article className={styles.supportCard} key={audienceKeys[index]}>
                <Icon aria-hidden="true" />
                <h3>{t(`support.items.${audienceKeys[index]}.title`)}</h3>
                <p>{t(`support.items.${audienceKeys[index]}.description`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.directionSection} aria-labelledby="direction-heading">
        <div className={`${styles.container} ${styles.directionGrid}`}>
          <div className={styles.directionCopy}>
            <p className={styles.sectionLabel}>{t("direction.eyebrow")}</p>
            <h2 id="direction-heading">{t("direction.title")}</h2>
            <p>{t("direction.paragraphOne")}</p>
            <p>{t("direction.paragraphTwo")}</p>
          </div>

          <div className={styles.ecosystemVisual} aria-label={t("direction.visualAriaLabel")}>
            <svg viewBox="0 0 620 620" role="img">
              <circle className={styles.orbitOuter} cx="310" cy="310" r="240" />
              <circle className={styles.orbitMiddle} cx="310" cy="310" r="172" />
              <circle className={styles.orbitInner} cx="310" cy="310" r="92" />
              <path
                className={styles.orbitPath}
                d="M90 300C155 126 440 82 535 286S429 552 252 523 61 420 90 300Z"
              />
              <path
                className={styles.orbitPathAlt}
                d="M146 137C330 62 538 187 526 376S273 589 121 451 17 190 146 137Z"
              />
              <g className={styles.ecosystemCore}>
                <circle cx="310" cy="310" r="62" />
                <path d="M281 310h58M310 281v58M289 289l42 42M331 289l-42 42" />
              </g>
              <g className={styles.visualNodes}>
                <circle cx="310" cy="70" r="7" />
                <circle cx="515" cy="185" r="7" />
                <circle cx="525" cy="420" r="7" />
                <circle cx="310" cy="550" r="7" />
                <circle cx="95" cy="420" r="7" />
              </g>
            </svg>
            <span className={styles.coreLabel}>SynergyMazeAI</span>
            <span className={`${styles.orbitLabel} ${styles.labelResearch}`}>
              {t("direction.labels.research")}
            </span>
            <span className={`${styles.orbitLabel} ${styles.labelInnovation}`}>
              {t("direction.labels.innovation")}
            </span>
            <span className={`${styles.orbitLabel} ${styles.labelEducation}`}>
              {t("direction.labels.education")}
            </span>
            <span className={`${styles.orbitLabel} ${styles.labelIndustry}`}>
              {t("direction.labels.industry")}
            </span>
            <span className={`${styles.orbitLabel} ${styles.labelImpact}`}>
              {t("direction.labels.impact")}
            </span>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection} aria-labelledby="mission-vision-cta-heading">
        <div className={styles.ctaMedia} aria-hidden="true">
          <Image
            className={`${styles.themeImage} ${styles.lightImage}`}
            src="/images/about/about-cta-light.png"
            alt=""
            fill
            quality={94}
            sizes="100vw"
          />
          <Image
            className={`${styles.themeImage} ${styles.darkImage}`}
            src="/images/about/about-cta-dark.png"
            alt=""
            fill
            quality={94}
            sizes="100vw"
          />
        </div>
        <div className={styles.ctaShade} aria-hidden="true" />

        <div className={`${styles.container} ${styles.ctaInner}`}>
          <div className={styles.ctaCopy}>
            <p className={styles.sectionLabel}>{t("cta.eyebrow")}</p>
            <h2 id="mission-vision-cta-heading">{t("cta.title")}</h2>
            <p>{t("cta.description")}</p>
            <a className={styles.ctaButton} href={localizedPath(params.locale, "/contact")}>
              {t("cta.button")}
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
