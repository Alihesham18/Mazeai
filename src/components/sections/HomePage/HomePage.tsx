import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Code2,
  Dna,
  ExternalLink,
  FlaskConical,
  GraduationCap
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { NewsPopup } from "@/components/home/NewsPopup/NewsPopup";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { activeResearchProjects } from "@/data/active-research-projects";
import type { Locale } from "@/i18n/routing";
import { localizedPath, localize } from "@/lib/utilities/localize";

import styles from "./HomePage.module.css";

const schools = [
  {
    name: "Doğa Koleji",
    href: "https://www.dogakoleji.k12.tr/",
    logo: "/images/schools/doga-koleji.png"
  },
  {
    name: "Mektebim Koleji",
    href: "https://www.mektebim.k12.tr/",
    logo: "/images/schools/mektebim-koleji.jpg"
  },
  {
    name: "Uğur Okulları",
    href: "https://ugurokullari.k12.tr/",
    logo: "/images/schools/ugur-okullari.png"
  }
] as const;

const pathways = [
  {
    titleKey: "home.aiPathTitle",
    descriptionKey: "home.aiPathDescription",
    href: "/services",
    icon: BrainCircuit
  },
  {
    titleKey: "home.researchPathTitle",
    descriptionKey: "home.researchPathDescription",
    href: "/research",
    icon: FlaskConical
  },
  {
    titleKey: "home.educationPathTitle",
    descriptionKey: "home.educationPathDescription",
    href: "/training",
    icon: GraduationCap
  }
] as const;

export async function HomePage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });
  const featuredProject = activeResearchProjects.find((project) => project.slug === "biopredict");

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Container className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{t("home.eyebrow")}</p>
            <h1>{t("home.headline")}</h1>
            <p className={styles.lead}>{t("home.supporting")}</p>

            <div className={styles.actions}>
              <Button href={localizedPath(locale, "/services")}>
                {t("home.primaryCta")}
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
              <Button href={localizedPath(locale, "/research")} variant="secondary">
                {t("home.researchCta")}
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className={styles.heroVisual} role="img" aria-label={t("home.visualLabel")}>
            <Image
              src="/images/hero-maze-network.png"
              alt=""
              fill
              priority
              sizes="(min-width: 960px) 54vw, 100vw"
              className={styles.heroImage}
            />
          </div>
        </Container>
      </section>

      <NewsPopup locale={locale} />

      <section className={styles.pathwaysSection}>
        <Container>
          <header className={styles.centeredHeader}>
            <p className={styles.sectionLabel}>{t("home.choosePathEyebrow")}</p>
            <h2>{t("home.choosePathTitle")}</h2>
          </header>

          <div className={styles.pathwayGrid}>
            {pathways.map(({ titleKey, descriptionKey, href, icon: Icon }) => (
              <Link className={styles.pathwayCard} href={localizedPath(locale, href)} key={href}>
                <span className={styles.pathwayIcon} aria-hidden="true">
                  <Icon size={29} />
                </span>
                <h3>{t(titleKey)}</h3>
                <p>{t(descriptionKey)}</p>
                <span className={styles.textLink}>
                  {t("home.explore")}
                  <ArrowRight size={15} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.trustSection} data-testid="schools-section">
        <Container>
          <h2 className={styles.visuallyHidden}>{t("home.partners")}</h2>
          <p className={styles.trustLabel}>{t("home.partnersEyebrow")}</p>

          <div className={styles.schoolGrid} aria-label={t("home.partners")}>
            {schools.map((school) => (
              <a
                className={styles.schoolLink}
                href={school.href}
                key={school.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${school.name} - ${t("home.schoolVisit")}`}
              >
                <span className={styles.schoolLogo}>
                  <Image src={school.logo} alt={`${school.name} logo`} fill sizes="150px" />
                </span>
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            ))}
          </div>
        </Container>
      </section>

      {featuredProject ? (
        <section className={styles.featuredSection}>
          <Container className={styles.featuredGrid}>
            <div className={styles.featuredCopy}>
              <p className={styles.sectionLabel}>{t("home.featuredEyebrow")}</p>
              <h2>{featuredProject.name}</h2>
              <p>{localize(featuredProject.description, locale)}</p>
              <Button href={localizedPath(locale, "/research#biopredict")} variant="secondary">
                {t("home.featuredProjectCta")}
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
            </div>

            <div className={styles.scienceVisual} aria-hidden="true">
              <span className={styles.visualOrb} />
              <Dna className={styles.dnaIcon} strokeWidth={1.2} />
              <span className={styles.dataLineOne} />
              <span className={styles.dataLineTwo} />
              <span className={styles.dataLineThree} />
            </div>
          </Container>
        </section>
      ) : null}

      <section className={styles.ctaSection}>
        <Container>
          <div className={styles.ctaPanel}>
            <span className={styles.ctaIcon} aria-hidden="true">
              <Code2 size={28} />
            </span>
            <div className={styles.ctaCopy}>
              <h2>{t("home.ctaTitle")}</h2>
              <p>{t("home.ctaText")}</p>
            </div>
            <Button href={localizedPath(locale, "/contact")}>
              {t("home.secondaryCta")}
              <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
