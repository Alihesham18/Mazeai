import Image from "next/image";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ContentCard, EventCard } from "@/components/cards/ContentCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section, SectionHeading } from "@/components/ui/Section";
import {
  blogPosts,
  caseStudies,
  coreAreas,
  events,
  researchProjects,
  services
} from "@/data/mock-content";
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

export async function HomePage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });
  const whyKeys = ["one", "two", "three", "four", "five", "six"] as const;

  return (
    <>
      <section className={styles.hero}>
        <Container className={styles.heroGrid}>
          <div>
            <p className={styles.eyebrow}>{t("home.eyebrow")}</p>
            <h1>{t("home.headline")}</h1>
            <p className={styles.lead}>{t("home.supporting")}</p>
            <div className={styles.actions}>
              <Button href={localizedPath(locale, "/services")}>{t("home.primaryCta")}</Button>
              <Button href={localizedPath(locale, "/contact")} variant="secondary">
                {t("home.secondaryCta")}
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <Section data-testid="schools-section">
        <Container>
          <SectionHeading title={t("home.partners")} description={t("home.partnerNote")} />
          <div className={styles.schoolGrid} aria-label={t("home.partners")}>
            {schools.map((school) => (
              <a
                className={styles.schoolCard}
                href={school.href}
                key={school.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${school.name} - ${t("home.schoolVisit")}`}
              >
                <span className={styles.schoolLogo}>
                  <Image
                    src={school.logo}
                    alt={`${school.name} logo`}
                    fill
                    sizes="(min-width: 700px) 33vw, 100vw"
                  />
                </span>
                <span className={styles.schoolContent}>
                  <strong>{school.name}</strong>
                  <span>
                    {t("home.schoolVisit")}
                    <ExternalLink size={19} strokeWidth={2} aria-hidden="true" />
                  </span>
                </span>
              </a>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading title={t("home.coreTitle")} />
          <div className={styles.grid3}>
            {coreAreas.map((area) => (
              <Card key={area.slug}>
                <h3>{localize(area.title, locale)}</h3>
                <p>{localize(area.description, locale)}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container className={styles.split}>
          <SectionHeading title={t("home.aboutTitle")} description={t("home.aboutText")} />
          <div className={styles.aboutPanel}>
            <h3>SynergyMazeAI</h3>
            <p>{t("footer.description")}</p>
            <Button href={localizedPath(locale, "/about")} variant="secondary">
              {t("common.learnMore")}
            </Button>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading title={t("home.servicesTitle")} />
          <div className={styles.gridCards}>
            {services.map((service) => (
              <ContentCard
                key={service.slug}
                item={service}
                locale={locale}
                href={`/services/${service.slug}`}
                ctaLabel={t("common.learnMore")}
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading title={t("home.projectsTitle")} />
          <div className={styles.gridCards}>
            {researchProjects.map((project) => (
              <ContentCard
                key={project.slug}
                item={project}
                locale={locale}
                href={`/research/projects/${project.slug}`}
                ctaLabel={t("common.readMore")}
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container className={styles.split}>
          <SectionHeading title={t("home.whyTitle")} />
          <ul className={styles.whyList}>
            {whyKeys.map((key) => (
              <li key={key}>
                <CheckCircle2 size={20} aria-hidden="true" />
                <span>{t(`home.why.${key}`)}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading title={t("home.eventsTitle")} />
          <div className={styles.gridCards}>
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
      </Section>

      <Section>
        <Container>
          <SectionHeading title={t("home.caseTitle")} />
          <div className={styles.gridCards}>
            {caseStudies.map((study) => (
              <ContentCard
                key={study.slug}
                item={study}
                locale={locale}
                href={`/case-studies/${study.slug}`}
                ctaLabel={t("common.readMore")}
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading title={t("home.insightsTitle")} />
          <div className={styles.gridCards}>
            {blogPosts.map((post) => (
              <ContentCard
                key={post.slug}
                item={post}
                locale={locale}
                href={`/blog/${post.slug}`}
                ctaLabel={t("common.readMore")}
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className={styles.cta}>
            <h2>{t("home.ctaTitle")}</h2>
            <p>{t("home.ctaText")}</p>
            <Button href={localizedPath(locale, "/contact")}>{t("navigation.partner")}</Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
