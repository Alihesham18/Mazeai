import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, MoveUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./ServiceDetailPage.module.css";

type ServiceKey = "webDevelopment" | "webDesign";

interface ServiceDetailPageProps {
  locale: Locale;
  serviceKey: ServiceKey;
  image: string;
  technologies: readonly string[];
}

const featureKeys = ["one", "two", "three", "four"] as const;
const processKeys = ["one", "two", "three", "four"] as const;

export async function ServiceDetailPage({
  locale,
  serviceKey,
  image,
  technologies
}: ServiceDetailPageProps) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: `services.${serviceKey}` });
  const common = await getTranslations({ locale, namespace: "services.common" });

  return (
    <>
      <section className={styles.hero}>
        <Container>
          <Link className={styles.backLink} href={localizedPath(locale, "/services")}>
            <ArrowLeft size={17} aria-hidden="true" />
            {common("backToServices")}
          </Link>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{t("eyebrow")}</p>
              <h1>{t("title")}</h1>
              <p className={styles.lead}>{t("intro")}</p>
              <Button href={localizedPath(locale, "/contact")}>
                {common("startProject")}
                <MoveUpRight size={18} aria-hidden="true" />
              </Button>
            </div>
            <div className={styles.heroMedia}>
              <Image
                src={image}
                alt={t("imageAlt")}
                fill
                priority
                sizes="(min-width: 980px) 48vw, 100vw"
                className={styles.image}
              />
            </div>
          </div>
        </Container>
      </section>

      <section className={styles.section}>
        <Container className={styles.overviewGrid}>
          <div>
            <p className={styles.eyebrow}>{common("whatWeDo")}</p>
            <h2>{t("overviewTitle")}</h2>
          </div>
          <p className={styles.overviewText}>{t("overviewText")}</p>
        </Container>
      </section>

      <section className={styles.section}>
        <Container>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{common("included")}</p>
            <h2>{t("featuresTitle")}</h2>
          </div>
          <div className={styles.featureGrid}>
            {featureKeys.map((key) => (
              <article className={styles.feature} key={key}>
                <span className={styles.check} aria-hidden="true">
                  <Check size={18} />
                </span>
                <h3>{t(`features.${key}.title`)}</h3>
                <p>{t(`features.${key}.description`)}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.section}>
        <Container className={styles.processGrid}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{common("howItWorks")}</p>
            <h2>{t("processTitle")}</h2>
          </div>
          <ol className={styles.processList}>
            {processKeys.map((key, index) => (
              <li key={key}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{t(`process.${key}.title`)}</h3>
                  <p>{t(`process.${key}.description`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className={styles.section}>
        <Container>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{common("tools")}</p>
            <h2>{t("technologiesTitle")}</h2>
          </div>
          <ul className={styles.technologyList}>
            {technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section className={styles.ctaSection}>
        <Container className={styles.cta}>
          <div>
            <h2>{t("ctaTitle")}</h2>
            <p>{t("ctaText")}</p>
          </div>
          <Button href={localizedPath(locale, "/contact")}>{common("startProject")}</Button>
        </Container>
      </section>
    </>
  );
}
