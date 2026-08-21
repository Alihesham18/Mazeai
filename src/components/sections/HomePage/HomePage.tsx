import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CalendarDays,
  FlaskConical,
  GraduationCap,
  MapPin
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CaseStudyCoverImage } from "@/components/case-studies/CaseStudyCoverImage";
import { MazeHeroGraphic } from "@/components/home/MazeHeroGraphic";
import { NewsPopup } from "@/components/home/NewsPopup/NewsPopup";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/Section";
import { TechnicalDetail, TechnicalLabel } from "@/components/ui/TechnicalDetail";
import { getDirection, type Locale } from "@/i18n/routing";
import { getPublishedCaseStudies } from "@/lib/directus/case-studies";
import { getPublishedEvents } from "@/lib/directus/events";
import { localizedPath } from "@/lib/utilities/localize";

import sectionStyles from "./HomePageSections.module.css";
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

const credibilityKeys = ["one", "three", "four", "six"] as const;

function formatDate(value: string | null, locale: Locale) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}

export async function HomePage({ locale }: { locale: Locale }) {
  const [t, eventResult, caseStudyResult] = await Promise.all([
    getTranslations({ locale }),
    getPublishedEvents(),
    getPublishedCaseStudies(locale)
  ]);
  const now = Date.now();
  const selectedEvent = eventResult.ok
    ? ([...eventResult.data]
        .filter((event) => Date.parse(event.event_date) >= now)
        .sort((first, second) => Date.parse(first.event_date) - Date.parse(second.event_date))[0] ??
      null)
    : null;
  const latestCompletedEvent = eventResult.ok
    ? ([...eventResult.data]
        .filter((event) => Date.parse(event.event_date) < now)
        .sort((first, second) => Date.parse(second.event_date) - Date.parse(first.event_date))[0] ??
      null)
    : null;
  const selectedCaseStudies = caseStudyResult.ok
    ? [...caseStudyResult.data]
        .sort((first, second) => Number(second.featured) - Number(first.featured))
        .slice(0, 2)
    : [];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Container size="wide" className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <TechnicalLabel index="01" className={styles.eyebrow}>
              {t("home.eyebrow")}
            </TechnicalLabel>
            <h1>{t("home.headline")}</h1>
            <p className={styles.lead}>{t("home.supporting")}</p>

            <div className={styles.actions}>
              <Button href={localizedPath(locale, "/services")}>
                {t("home.primaryCta")}
                <ArrowRight className={styles.directionalIcon} size={17} aria-hidden="true" />
              </Button>
              <Button href={localizedPath(locale, "/research")} variant="outline">
                {t("home.researchCta")}
                <ArrowRight className={styles.directionalIcon} size={17} aria-hidden="true" />
              </Button>
            </div>

            <div className={styles.heroTrust} aria-label={t("home.choosePathTitle")}>
              <span>
                <b>01</b>
                {t("home.aiPathTitle")}
              </span>
              <span>
                <b>02</b>
                {t("home.researchPathTitle")}
              </span>
              <span>
                <b>03</b>
                {t("home.educationPathTitle")}
              </span>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <MazeHeroGraphic label={t("home.visualLabel")} systemLabel={t("home.eyebrow")} />
          </div>
        </Container>
      </section>

      <NewsPopup event={latestCompletedEvent} locale={locale} />

      <section className={sectionStyles.capabilities} data-home-section="capabilities">
        <Container>
          <SectionHeading
            eyebrow={t("home.choosePathEyebrow")}
            title={t("home.choosePathTitle")}
            description={t("home.capabilitiesDescription")}
          />

          <div className={sectionStyles.capabilityGrid}>
            {pathways.map(({ titleKey, descriptionKey, href, icon: Icon }, index) => (
              <Card
                className={sectionStyles.capabilityCard}
                data-featured={index === 0 || undefined}
                interactive
                key={href}
                variant={index === 0 ? "featured" : "technical"}
              >
                <div className={sectionStyles.capabilityTopline}>
                  <span>{String(index + 1).padStart(2, "0")} / CAP</span>
                  <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <h3>{t(titleKey)}</h3>
                <p>{t(descriptionKey)}</p>
                <Link className={sectionStyles.inlineLink} href={localizedPath(locale, href)}>
                  {t("home.explore")}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className={sectionStyles.work} data-home-section="work">
        <Container>
          <div className={sectionStyles.sectionTopline}>
            <SectionHeading
              compact
              eyebrow={t("home.caseEyebrow")}
              title={t("home.caseTitle")}
              description={t("home.workDescription")}
            />
            <Button href={localizedPath(locale, "/case-studies")} variant="text">
              {t("home.viewAllCaseStudies")}
              <ArrowRight className={sectionStyles.directionalIcon} size={16} aria-hidden="true" />
            </Button>
          </div>

          {!caseStudyResult.ok ? (
            <p className={sectionStyles.state} role="alert">
              {t("caseStudies.unableToLoad")}
            </p>
          ) : selectedCaseStudies.length === 0 ? (
            <p className={sectionStyles.state}>{t("caseStudies.empty")}</p>
          ) : (
            <div className={sectionStyles.workGrid}>
              {selectedCaseStudies.map((caseStudy, index) => (
                <Card
                  className={sectionStyles.workCard}
                  data-featured={index === 0 || undefined}
                  interactive
                  key={caseStudy.id}
                  lang={caseStudy.locale}
                  dir={getDirection(caseStudy.locale)}
                  variant={index === 0 ? "featured" : "standard"}
                >
                  {caseStudy.coverImage ? (
                    <CaseStudyCoverImage
                      alt={caseStudy.title}
                      className={sectionStyles.workImage}
                      imageClassName={sectionStyles.workImageElement}
                      sizes="(min-width: 900px) 45vw, 100vw"
                      src={caseStudy.coverImage}
                    />
                  ) : (
                    <div className={sectionStyles.workPlaceholder} aria-hidden="true">
                      <TechnicalDetail variant="mazeCorner" />
                      <span>WORK / {String(index + 1).padStart(2, "0")}</span>
                    </div>
                  )}
                  <div className={sectionStyles.workBody}>
                    <div className={sectionStyles.workMeta}>
                      {caseStudy.industry ? <Badge>{caseStudy.industry}</Badge> : null}
                      <span>{String(index + 1).padStart(2, "0")} / WORK</span>
                    </div>
                    <h3>{caseStudy.title}</h3>
                    {caseStudy.shortDescription ? <p>{caseStudy.shortDescription}</p> : null}
                    {caseStudy.technologies.length > 0 ? (
                      <ul
                        className={sectionStyles.technicalTags}
                        aria-label={t("caseStudies.technologies")}
                      >
                        {caseStudy.technologies.slice(0, 3).map((technology) => (
                          <li key={technology}>{technology}</li>
                        ))}
                      </ul>
                    ) : null}
                    <Link
                      className={sectionStyles.inlineLink}
                      href={localizedPath(locale, `/case-studies/${caseStudy.slug}`)}
                    >
                      {t("caseStudies.readCaseStudy", { title: caseStudy.title })}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </section>

      <section
        className={sectionStyles.partners}
        data-home-section="ecosystem"
        aria-labelledby="home-partners-heading"
      >
        <Container>
          <div className={sectionStyles.partnersLayout}>
            <div className={sectionStyles.partnersCopy}>
              <TechnicalLabel index="05">{t("home.partnersEyebrow")}</TechnicalLabel>
              <h2 id="home-partners-heading">{t("home.ecosystemTitle")}</h2>
              <p>{t("home.partnerNote")}</p>
              <Button href={localizedPath(locale, "/contact")} variant="outline">
                {t("home.secondaryCta")}
              </Button>
            </div>
            <div className={sectionStyles.partnerLogos} aria-label={t("home.partners")}>
              {schools.map((school) => (
                <a
                  aria-label={`${school.name} — ${t("home.schoolVisit")}`}
                  className={sectionStyles.partnerLogo}
                  href={school.href}
                  key={school.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className={sectionStyles.partnerLogoMedia}>
                    <Image alt={school.name} fill sizes="150px" src={school.logo} />
                  </span>
                  <span className={sectionStyles.partnerLogoFooter}>
                    <strong>{school.name}</strong>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className={sectionStyles.credibilityInner}>
            <div className={sectionStyles.credibilityIntro}>
              <TechnicalLabel index="TRUST">{t("home.credibilityEyebrow")}</TechnicalLabel>
              <h3 className={sectionStyles.visuallyHidden}>{t("home.whyTitle")}</h3>
            </div>
            <div className={sectionStyles.credibilityItems}>
              {credibilityKeys.map((key, index) => (
                <span key={key}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  {t(`home.why.${key}`)}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className={sectionStyles.activity} data-home-section="activity">
        <Container size="wide">
          <div className={sectionStyles.sectionTopline}>
            <SectionHeading
              compact
              eyebrow={t("home.eventsEyebrow")}
              title={t("home.activityTitle")}
              description={t("home.activityDescription")}
            />
            <Button href={localizedPath(locale, "/events")} variant="text">
              {t("home.viewAllEvents")}
              <ArrowRight className={sectionStyles.directionalIcon} size={16} aria-hidden="true" />
            </Button>
          </div>

          {!eventResult.ok ? (
            <p className={sectionStyles.state} role="alert">
              {t("events.unableToLoadEvents")}
            </p>
          ) : !selectedEvent ? (
            <p className={sectionStyles.state}>{t("events.noEvents")}</p>
          ) : (
            <Card className={sectionStyles.eventFeature} variant="technical">
              <div className={sectionStyles.eventDateBlock}>
                <CalendarDays size={22} aria-hidden="true" />
                <time dateTime={selectedEvent.event_date}>
                  {formatDate(selectedEvent.event_date, locale)}
                </time>
              </div>
              <div className={sectionStyles.eventBody}>
                <div className={sectionStyles.eventMeta}>
                  <Badge>{selectedEvent.format || t("events.event")}</Badge>
                  <span>
                    <MapPin size={14} aria-hidden="true" />
                    {selectedEvent.location || t("events.locationPending")}
                  </span>
                </div>
                <h3>{selectedEvent.title}</h3>
                {selectedEvent.short_description ? <p>{selectedEvent.short_description}</p> : null}
                <Link
                  className={sectionStyles.inlineLink}
                  href={localizedPath(locale, `/events/${selectedEvent.slug}`)}
                >
                  {t("home.viewEvent")}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </Card>
          )}
        </Container>
      </section>

      <section
        className={sectionStyles.finalCta}
        data-home-section="cta"
        aria-labelledby="home-final-cta-heading"
      >
        <Container>
          <div className={sectionStyles.finalCtaPanel}>
            <TechnicalDetail variant="grid" className={sectionStyles.finalCtaGrid} />
            <TechnicalDetail variant="mazeCorner" className={sectionStyles.finalCtaCorner} />
            <TechnicalLabel index="09">{t("navigation.partner")}</TechnicalLabel>
            <h2 id="home-final-cta-heading">{t("home.ctaTitle")}</h2>
            <p>{t("home.ctaText")}</p>
            <Button href={localizedPath(locale, "/contact")}>
              {t("home.secondaryCta")}
              <ArrowRight className={sectionStyles.directionalIcon} size={17} aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
