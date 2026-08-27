import { ArrowRight, MapPin, Network, ShieldCheck, UsersRound, Workflow } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { createPageMetadata, type StandalonePageConfig } from "@/components/pages/StandalonePage";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./about.module.css";

interface AboutPageProps {
  params: {
    locale: Locale;
  };
}

const page: StandalonePageConfig = {
  path: "about",
  titleKey: "pages.about.title",
  descriptionKey: "pages.about.description",
  sections: ["Who we are", "What we connect", "How we work", "Who we support"]
};

export const generateMetadata = createPageMetadata(page);

export default async function AboutPage({ params }: AboutPageProps) {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "pages.about"
  });

  const sections = [
    {
      key: "connect",
      icon: Network,
      accent: "gold",
      number: "01",
      detail: t("connect.detail")
    },
    {
      key: "work",
      icon: Workflow,
      accent: "violet",
      number: "02",
      detail: t("work.detail")
    },
    {
      key: "support",
      icon: UsersRound,
      accent: "violet",
      number: "03",
      detail: t("support.detail")
    },
    {
      key: "responsibility",
      icon: ShieldCheck,
      accent: "gold",
      number: "04",
      detail: t("responsibility.detail")
    }
  ] as const;

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="about-heading">
        <div className={styles.heroMedia} aria-hidden="true">
          <Image
            className={`${styles.heroImage} ${styles.heroImageLight}`}
            src="/images/about/about-hero-light.png"
            alt=""
            fill
            priority
            quality={94}
            sizes="100vw"
          />

          <Image
            className={`${styles.heroImage} ${styles.heroImageDark}`}
            src="/images/about/about-hero-dark.png"
            alt=""
            fill
            priority
            quality={94}
            sizes="100vw"
          />
        </div>

        <div className={styles.heroShade} aria-hidden="true" />

        <div className={styles.container}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>{t("hero.eyebrow")}</p>

            <h1 id="about-heading" className={styles.title}>
              {t("hero.title")}
            </h1>

            <p className={styles.lead}>{t("hero.lead")}</p>

            <p className={styles.location}>
              <MapPin size={18} aria-hidden="true" />
              {t("hero.location")}
            </p>
          </div>
        </div>
      </section>

      <section className={styles.introduction} aria-labelledby="who-we-are-heading">
        <div className={styles.container}>
          <div className={styles.introGrid}>
            <div className={styles.introStatement}>
              <p className={styles.sectionLabel}>{t("overview.label")}</p>

              <h2 id="who-we-are-heading">{t("overview.title")}</h2>

              <span className={styles.introRule} aria-hidden="true" />
            </div>

            <div className={styles.introCopy}>
              <p>{t("overview.paragraphOne")}</p>
              <p>{t("overview.paragraphTwo")}</p>
              <p>{t("overview.paragraphThree")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.framework} aria-label={t("frameworkLabel")}>
        <div className={styles.container}>
          <div className={styles.frameworkHeader}>
            <p className={styles.sectionLabel}>{t("frameworkLabel")}</p>
            <span aria-hidden="true" />
          </div>

          <div className={styles.frameworkGrid}>
            {sections.map(({ key, icon: Icon, accent, detail, number }) => (
              <article className={styles.frameworkCard} data-accent={accent} key={key}>
                <div className={styles.cardTop}>
                  <span className={styles.cardNumber} aria-hidden="true">
                    {number}
                  </span>

                  <span className={styles.cardIcon} aria-hidden="true">
                    <Icon />
                  </span>
                </div>

                <h2>{t(`${key}.title`)}</h2>

                <p className={styles.cardDescription}>{t(`${key}.description`)}</p>

                <p className={styles.cardDetail}>{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection} aria-labelledby="about-cta-heading">
        <div className={styles.ctaMedia} aria-hidden="true">
          <Image
            className={`${styles.ctaImage} ${styles.ctaImageLight}`}
            src="/images/about/about-cta-light.png"
            alt=""
            fill
            quality={94}
            sizes="100vw"
          />

          <Image
            className={`${styles.ctaImage} ${styles.ctaImageDark}`}
            src="/images/about/about-cta-dark.png"
            alt=""
            fill
            quality={94}
            sizes="100vw"
          />
        </div>

        <div className={styles.ctaShade} aria-hidden="true" />

        <div className={styles.container}>
          <div className={styles.ctaCopy}>
            <p className={styles.sectionLabel}>{t("cta.label")}</p>

            <h2 id="about-cta-heading">{t("cta.title")}</h2>

            <p>{t("cta.description")}</p>

            <a className={styles.ctaButton} href={localizedPath(params.locale, "/contact")}>
              {t("cta.button")}
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
