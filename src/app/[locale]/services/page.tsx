import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPageMetadata, type StandalonePageConfig } from "@/components/pages/StandalonePage";
import { AiConsultingVisual } from "@/components/services/AiConsultingVisual";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { TechnicalDetail, TechnicalLabel } from "@/components/ui/TechnicalDetail";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./ServicesPage.module.css";

const page: StandalonePageConfig = {
  path: "services",
  titleKey: "pages.services.title",
  descriptionKey: "pages.services.description",
  sections: []
};

export const generateMetadata = createPageMetadata(page);

const philosophyKeys = ["one", "two", "three"] as const;
const services = [
  {
    number: "01",
    key: "webDevelopment",
    href: "/services/web-development",
    image: "/images/web-development-service.png"
  },
  {
    number: "02",
    key: "webDesign",
    href: "/services/web-design",
    image: "/images/web-design-service.png"
  },
  {
    number: "03",
    key: "aiConsulting",
    href: "/services/ai-consulting",
    image: null
  }
] as const;

export default async function ServicesPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "services" });

  return (
    <>
      <section className={styles.intro}>
        <TechnicalDetail variant="grid" className={styles.introGrid} />
        <Container className={styles.introLayout}>
          <div>
            <TechnicalLabel index="01">{t("overview.eyebrow")}</TechnicalLabel>
            <h1>{t("overview.title")}</h1>
          </div>
          <div className={styles.introCopy}>
            <TechnicalDetail variant="line" />
            <p>{t("overview.description")}</p>
          </div>
        </Container>
      </section>

      <section className={styles.philosophy} aria-labelledby="services-philosophy-title">
        <Container>
          <div className={styles.sectionHeading}>
            <TechnicalLabel index="02">{t("overview.philosophy.eyebrow")}</TechnicalLabel>
            <h2 id="services-philosophy-title">{t("overview.philosophy.title")}</h2>
          </div>
          <div className={styles.quoteGrid}>
            {philosophyKeys.map((key, index) => (
              <blockquote className={styles.quote} key={key}>
                <span className={styles.quoteNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p>{t(`overview.philosophy.items.${key}`)}</p>
              </blockquote>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.directory} aria-labelledby="services-directory-title">
        <Container>
          <div className={styles.sectionHeading}>
            <TechnicalLabel index="03">{t("overview.directoryEyebrow")}</TechnicalLabel>
            <h2 id="services-directory-title">{t("overview.directoryTitle")}</h2>
          </div>

          <div className={styles.serviceList}>
            {services.map((service) => (
              <article className={styles.service} key={service.key}>
                <div className={styles.serviceContent}>
                  <span className={styles.serviceNumber} aria-hidden="true">
                    {service.number}
                  </span>
                  <h3>{t(`${service.key}.title`)}</h3>
                  <p>{t(`${service.key}.shortDescription`)}</p>
                  <Button
                    href={localizedPath(params.locale, service.href)}
                    variant="outline"
                    className={styles.serviceLink}
                  >
                    {t(`overview.explore.${service.key}`)}
                    <ArrowUpRight aria-hidden="true" className={styles.directionalIcon} size={18} />
                  </Button>
                </div>
                <div className={styles.serviceVisual}>
                  {service.image ? (
                    <Image
                      src={service.image}
                      alt={t(`${service.key}.imageAlt`)}
                      fill
                      sizes="(min-width: 900px) 48vw, 100vw"
                      className={styles.serviceImage}
                    />
                  ) : (
                    <AiConsultingVisual className={styles.aiVisual} />
                  )}
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.ctaSection}>
        <Container className={styles.cta}>
          <TechnicalDetail variant="mazeCorner" className={styles.ctaCorner} />
          <div>
            <TechnicalLabel index="04">{t("overview.ctaEyebrow")}</TechnicalLabel>
            <h2>{t("overview.ctaTitle")}</h2>
            <p>{t("overview.ctaText")}</p>
          </div>
          <Button href={localizedPath(params.locale, "/contact")}>
            {t("overview.ctaAction")}
            <ArrowUpRight aria-hidden="true" className={styles.directionalIcon} size={18} />
          </Button>
        </Container>
      </section>
    </>
  );
}
