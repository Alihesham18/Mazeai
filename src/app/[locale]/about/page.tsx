import {
  ArrowRight,
  Building2,
  MapPin,
  Network,
  ShieldCheck,
  UsersRound,
  Workflow
} from "lucide-react";
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
      accent: "violet",
      detail: t("connect.detail")
    },
    {
      key: "work",
      icon: Workflow,
      accent: "cyan",
      detail: t("work.detail")
    },
    {
      key: "support",
      icon: UsersRound,
      accent: "gold",
      detail: t("support.detail")
    },
    {
      key: "responsibility",
      icon: ShieldCheck,
      accent: "cyan",
      detail: t("responsibility.detail")
    }
  ] as const;

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="about-heading">
        <Image
          className={styles.heroImage}
          src="/images/about-synergymazeai-team.png"
          alt={t("hero.imageAlt")}
          fill
          priority
          sizes="100vw"
        />
        <div className={styles.heroShade} aria-hidden="true" />

        <div className={styles.container}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>{t("hero.eyebrow")}</p>
            <h1 id="about-heading" className={styles.title}>
              {t("hero.title")}
            </h1>
            <p className={styles.lead}>{t("hero.lead")}</p>
          </div>

          <p className={styles.location}>
            <MapPin size={18} aria-hidden="true" />
            {t("hero.location")}
          </p>
        </div>
      </section>

      <section className={styles.introduction} aria-labelledby="who-we-are-heading">
        <div className={styles.container}>
          <div className={styles.introGrid}>
            <div className={styles.sectionHeading}>
              <UsersRound aria-hidden="true" />
              <div>
                <p className={styles.sectionLabel}>{t("overview.label")}</p>
                <h2 id="who-we-are-heading">{t("overview.title")}</h2>
              </div>
            </div>

            <div className={styles.copy}>
              <p>{t("overview.paragraphOne")}</p>
              <p>{t("overview.paragraphTwo")}</p>
              <p>{t("overview.paragraphThree")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.framework} aria-label={t("frameworkLabel")}>
        <div className={styles.container}>
          {sections.map(({ key, icon: Icon, accent, detail }) => (
            <article className={styles.frameworkRow} key={key}>
              <div className={styles.rowHeading} data-accent={accent}>
                <span className={styles.iconFrame} aria-hidden="true">
                  <Icon />
                </span>
                <h2>{t(`${key}.title`)}</h2>
              </div>

              <p className={styles.rowDescription}>{t(`${key}.description`)}</p>
              <p className={styles.rowDetail}>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.ctaSection} aria-labelledby="about-cta-heading">
        <div className={styles.container}>
          <div className={styles.ctaMark} aria-hidden="true">
            <Building2 />
          </div>
          <div className={styles.ctaCopy}>
            <p className={styles.sectionLabel}>{t("cta.label")}</p>
            <h2 id="about-cta-heading">{t("cta.title")}</h2>
            <p>{t("cta.description")}</p>
          </div>
          <a className={styles.ctaButton} href={localizedPath(params.locale, "/contact")}>
            {t("cta.button")}
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}
