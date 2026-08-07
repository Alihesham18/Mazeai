import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Code2,
  ExternalLink,
  FlaskConical,
  GraduationCap,
  Handshake,
  Microscope,
  Network,
  Settings2,
  Sparkles,
  Workflow
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EventCard } from "@/components/cards/ContentCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { activeResearchProjects } from "@/data/active-research-projects";
import { blogPosts, caseStudies, coreAreas, events, services } from "@/data/mock-content";
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

const coreIcons = [BrainCircuit, Microscope, GraduationCap] as const;
const serviceIcons = [Sparkles, Bot, FlaskConical, GraduationCap, Handshake, Settings2] as const;
const researchIcons = [FlaskConical, Network, Workflow] as const;

export async function HomePage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });
  const whyKeys = ["one", "two", "three", "four", "five", "six"] as const;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Container className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{t("home.eyebrow")}</p>
            <h1>{t("home.headline")}</h1>
            <p className={styles.lead}>{t("home.supporting")}</p>
            <div className={styles.actions}>
              <Button className={styles.primaryAction} href={localizedPath(locale, "/services")}>
                {t("home.primaryCta")}
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
              <Button
                className={styles.secondaryAction}
                href={localizedPath(locale, "/research")}
                variant="secondary"
              >
                {t("home.researchCta")}
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className={styles.heroVisual} role="img" aria-label={t("home.visualLabel")}>
            <span className={styles.heroAsset} aria-hidden="true" />
            <span className={styles.heroGridLines} aria-hidden="true" />
            <span className={styles.mazePlane} aria-hidden="true">
              <span className={styles.mazeCore}>
                <BrainCircuit size={42} strokeWidth={1.35} />
              </span>
              <span className={`${styles.mazeNode} ${styles.nodeOne}`} />
              <span className={`${styles.mazeNode} ${styles.nodeTwo}`} />
              <span className={`${styles.mazeNode} ${styles.nodeThree}`} />
              <span className={`${styles.mazeNode} ${styles.nodeFour}`} />
              <span className={`${styles.mazeNode} ${styles.nodeFive}`} />
            </span>
          </div>
        </Container>
      </section>

      <section className={styles.trustSection} data-testid="schools-section">
        <Container className={styles.trustInner}>
          <h2 className={styles.visuallyHidden}>{t("home.partners")}</h2>
          <div className={styles.trustCopy}>
            <p className={styles.sectionLabel}>{t("home.partnersEyebrow")}</p>
            <p>{t("home.partnerNote")}</p>
          </div>
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
                  <Image src={school.logo} alt={`${school.name} logo`} fill sizes="120px" />
                </span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ))}
          </div>
        </Container>
      </section>

      <div className={styles.sectionGroup}>
        <section className={styles.section}>
          <Container>
            <header className={styles.sectionHeader}>
              <p className={styles.sectionLabel}>{t("home.coreEyebrow")}</p>
              <h2>{t("home.coreTitle")}</h2>
              <p>{t("home.coreDescription")}</p>
            </header>
            <div className={styles.coreGrid}>
              {coreAreas.map((area, index) => {
                const Icon = coreIcons[index];
                const href =
                  index === 0 ? "/services/ai-consulting" : index === 1 ? "/research" : "/training";

                return (
                  <Link
                    className={styles.coreCard}
                    href={localizedPath(locale, href)}
                    key={area.slug}
                  >
                    <span className={styles.iconBox} aria-hidden="true">
                      <Icon size={28} />
                    </span>
                    <h3>{localize(area.title, locale)}</h3>
                    <p>{localize(area.description, locale)}</p>
                    <span className={styles.textLink}>
                      {t("common.learnMore")}
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </Container>
        </section>

        <section className={`${styles.section} ${styles.aboutSection}`}>
          <Container className={styles.aboutGrid}>
            <div className={styles.aboutCopy}>
              <p className={styles.sectionLabel}>{t("home.aboutEyebrow")}</p>
              <h2>{t("home.aboutTitle")}</h2>
              <p>{t("home.aboutText")}</p>
              <Button href={localizedPath(locale, "/about")} variant="secondary">
                {t("common.learnMore")}
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
            </div>
            <figure className={styles.aboutVisual}>
              <Image
                src="/images/about-synergymazeai-team.png"
                alt={t("home.aboutImageAlt")}
                fill
                sizes="(min-width: 980px) 50vw, 100vw"
              />
            </figure>
          </Container>
        </section>

        <section className={styles.section}>
          <Container>
            <header className={styles.sectionHeader}>
              <p className={styles.sectionLabel}>{t("home.servicesEyebrow")}</p>
              <h2>{t("home.servicesTitle")}</h2>
            </header>
            <div className={styles.servicesGrid}>
              {services.map((service, index) => {
                const Icon = serviceIcons[index];
                return (
                  <Link
                    className={styles.serviceCard}
                    href={localizedPath(locale, `/services/${service.slug}`)}
                    key={service.slug}
                  >
                    <Icon size={22} aria-hidden="true" />
                    <h3>{localize(service.title, locale)}</h3>
                    <p>{localize(service.description, locale)}</p>
                    <ArrowUpRight className={styles.cornerArrow} size={17} aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </Container>
        </section>
      </div>

      <div className={styles.sectionGroup}>
        <section className={`${styles.section} ${styles.researchSection}`}>
          <Container>
            <div className={styles.headingRow}>
              <header className={styles.sectionHeader}>
                <p className={styles.sectionLabel}>{t("home.projectsEyebrow")}</p>
                <h2>{t("home.projectsTitle")}</h2>
                <p>{t("home.projectsDescription")}</p>
              </header>
              <Link className={styles.allLink} href={localizedPath(locale, "/research")}>
                {t("home.viewAllProjects")}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.researchGrid}>
              {activeResearchProjects.slice(0, 3).map((project, index) => {
                const Icon = researchIcons[index];
                return (
                  <Link
                    className={styles.researchCard}
                    href={localizedPath(locale, `/research#${project.slug}`)}
                    key={project.slug}
                  >
                    <span className={styles.researchVisual} aria-hidden="true">
                      <span className={styles.researchOrbit} />
                      <Icon size={42} strokeWidth={1.35} />
                    </span>
                    <span className={styles.researchContent}>
                      <span className={styles.projectMeta}>
                        {project.type} · {localize(project.category, locale)}
                      </span>
                      <strong>{project.name}</strong>
                      <span>{localize(project.description, locale)}</span>
                      <span className={styles.textLink}>
                        {t("common.readMore")}
                        <ArrowRight size={16} aria-hidden="true" />
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </Container>
        </section>

        <section className={`${styles.section} ${styles.whySection}`}>
          <Container className={styles.whyGrid}>
            <div className={styles.whyStatement}>
              <p className={styles.sectionLabel}>{t("home.whyEyebrow")}</p>
              <h2>{t("home.whyTitle")}</h2>
              <p>{t("home.whyDescription")}</p>
            </div>
            <ul className={styles.whyList}>
              {whyKeys.map((key) => (
                <li key={key}>
                  <CheckCircle2 size={20} aria-hidden="true" />
                  <span>{t(`home.why.${key}`)}</span>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <section className={styles.section}>
          <Container>
            <div className={styles.headingRow}>
              <header className={styles.sectionHeader}>
                <p className={styles.sectionLabel}>{t("home.eventsEyebrow")}</p>
                <h2>{t("home.eventsTitle")}</h2>
              </header>
              <Link className={styles.allLink} href={localizedPath(locale, "/events")}>
                {t("home.viewAllEvents")}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.eventsGrid}>
              {events.map((event) => (
                <EventCard
                  key={event.slug}
                  item={event}
                  locale={locale}
                  ctaLabel={t("common.register")}
                />
              ))}
            </div>
          </Container>
        </section>
      </div>

      <section className={`${styles.section} ${styles.librarySection}`}>
        <Container className={styles.libraryGrid}>
          <div>
            <div className={styles.libraryHeading}>
              <div>
                <p className={styles.sectionLabel}>{t("home.caseEyebrow")}</p>
                <h2>{t("home.caseTitle")}</h2>
              </div>
              <Link href={localizedPath(locale, "/case-studies")} aria-label={t("home.caseTitle")}>
                <ArrowUpRight size={20} />
              </Link>
            </div>
            <div className={styles.linkList}>
              {caseStudies.map((study) => (
                <Link href={localizedPath(locale, `/case-studies/${study.slug}`)} key={study.slug}>
                  <span>
                    <strong>{localize(study.title, locale)}</strong>
                    <small>{localize(study.eyebrow!, locale)}</small>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className={styles.libraryHeading}>
              <div>
                <p className={styles.sectionLabel}>{t("home.insightsEyebrow")}</p>
                <h2>{t("home.insightsTitle")}</h2>
              </div>
              <Link href={localizedPath(locale, "/blog")} aria-label={t("home.insightsTitle")}>
                <ArrowUpRight size={20} />
              </Link>
            </div>
            <div className={styles.linkList}>
              {blogPosts.map((post) => (
                <Link href={localizedPath(locale, `/blog/${post.slug}`)} key={post.slug}>
                  <span>
                    <strong>{localize(post.title, locale)}</strong>
                    <small>{localize(post.description, locale)}</small>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className={styles.ctaSection}>
        <Container>
          <div className={styles.cta}>
            <span className={styles.ctaIcon} aria-hidden="true">
              <Code2 size={26} />
            </span>
            <div>
              <h2>{t("home.ctaTitle")}</h2>
              <p>{t("home.ctaText")}</p>
            </div>
            <Button href={localizedPath(locale, "/contact")}>
              {t("navigation.partner")}
              <ArrowRight size={17} aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
