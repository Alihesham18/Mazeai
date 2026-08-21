import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPageMetadata, type StandalonePageConfig } from "@/components/pages/StandalonePage";
import { AiConsultingVisual } from "@/components/services/AiConsultingVisual";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { TechnicalDetail, TechnicalLabel } from "@/components/ui/TechnicalDetail";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./AiConsultingPage.module.css";

const page: StandalonePageConfig = {
  path: "services/ai-consulting",
  titleKey: "services.aiConsulting.title",
  descriptionKey: "services.aiConsulting.intro",
  sections: []
};

export const generateMetadata = createPageMetadata(page);

const capabilityKeys = ["one", "two", "three", "four", "five"] as const;
const processKeys = ["one", "two", "three", "four", "five"] as const;
const deliverableKeys = ["one", "two", "three", "four", "five", "six", "seven"] as const;
const audienceKeys = ["one", "two", "three", "four", "five"] as const;

export default async function AiConsultingPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "services.aiConsulting" });
  const common = await getTranslations({ locale: params.locale, namespace: "services.common" });

  return (
    <>
      <section className={styles.hero}>
        <TechnicalDetail variant="grid" className={styles.heroGridDetail} />
        <Container>
          <Link className={styles.backLink} href={localizedPath(params.locale, "/services")}>
            <ArrowLeft aria-hidden="true" className={styles.backIcon} size={17} />
            {common("backToServices")}
          </Link>
          <div className={styles.heroLayout}>
            <div className={styles.heroCopy}>
              <TechnicalLabel index="AI / 01">{t("eyebrow")}</TechnicalLabel>
              <h1>{t("title")}</h1>
              <p>{t("intro")}</p>
              <div className={styles.heroActions}>
                <Button href={localizedPath(params.locale, "/contact")}>
                  {t("heroPrimary")}
                  <ArrowUpRight
                    aria-hidden="true"
                    className={styles.directionalIcon}
                    size={18}
                  />
                </Button>
                <Button href="#approach" variant="outline">
                  {t("heroSecondary")}
                </Button>
              </div>
            </div>
            <AiConsultingVisual className={styles.heroVisual} />
          </div>
        </Container>
      </section>

      <section className={styles.capabilities} id="approach" aria-labelledby="capabilities-title">
        <Container>
          <div className={styles.sectionHeading}>
            <TechnicalLabel index="02">{t("capabilities.eyebrow")}</TechnicalLabel>
            <h2 id="capabilities-title">{t("capabilities.title")}</h2>
            <p>{t("capabilities.description")}</p>
          </div>
          <div className={styles.capabilityList}>
            {capabilityKeys.map((key, index) => (
              <article className={styles.capability} key={key}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h3>{t(`capabilities.items.${key}.title`)}</h3>
                <p>{t(`capabilities.items.${key}.description`)}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.process} aria-labelledby="consulting-process-title">
        <Container className={styles.processLayout}>
          <div className={styles.sectionHeading}>
            <TechnicalLabel index="03">{t("process.eyebrow")}</TechnicalLabel>
            <h2 id="consulting-process-title">{t("process.title")}</h2>
            <p>{t("process.description")}</p>
          </div>
          <ol className={styles.processList}>
            {processKeys.map((key, index) => (
              <li key={key}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{t(`process.items.${key}.title`)}</h3>
                  <p>{t(`process.items.${key}.description`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className={styles.engagement} aria-labelledby="deliverables-title">
        <Container className={styles.engagementGrid}>
          <div>
            <div className={styles.sectionHeading}>
              <TechnicalLabel index="04">{t("deliverables.eyebrow")}</TechnicalLabel>
              <h2 id="deliverables-title">{t("deliverables.title")}</h2>
              <p>{t("deliverables.description")}</p>
            </div>
            <ul className={styles.checkList}>
              {deliverableKeys.map((key) => (
                <li key={key}>
                  <Check aria-hidden="true" size={17} />
                  <span>{t(`deliverables.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className={styles.audience} aria-labelledby="audience-title">
            <TechnicalDetail variant="mazeCorner" className={styles.audienceCorner} />
            <TechnicalLabel index="05">{t("audience.eyebrow")}</TechnicalLabel>
            <h2 id="audience-title">{t("audience.title")}</h2>
            <p>{t("audience.description")}</p>
            <ul>
              {audienceKeys.map((key) => (
                <li key={key}>{t(`audience.items.${key}`)}</li>
              ))}
            </ul>
          </aside>
        </Container>
      </section>

      <section className={styles.ctaSection}>
        <Container className={styles.cta}>
          <TechnicalDetail variant="circuit" className={styles.ctaCircuit} />
          <div>
            <TechnicalLabel index="06">{t("ctaEyebrow")}</TechnicalLabel>
            <h2>{t("ctaTitle")}</h2>
            <p>{t("ctaText")}</p>
          </div>
          <div className={styles.ctaActions}>
            <Button href={localizedPath(params.locale, "/contact")}>
              {t("ctaPrimary")}
              <ArrowUpRight aria-hidden="true" className={styles.directionalIcon} size={18} />
            </Button>
            <Button href={localizedPath(params.locale, "/services")} variant="outline">
              {t("ctaSecondary")}
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
