import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createPageMetadata, type StandalonePageConfig } from "@/components/pages/StandalonePage";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./ServicesPage.module.css";

const page: StandalonePageConfig = {
  path: "services",
  titleKey: "pages.services.title",
  descriptionKey: "pages.services.description",
  sections: ["Hero", "Service cards", "Process", "FAQ", "CTA"]
};

export const generateMetadata = createPageMetadata(page);

const services = [
  {
    key: "webDevelopment",
    href: "/services/web-development",
    image: "/images/web-development-service.png"
  },
  {
    key: "webDesign",
    href: "/services/web-design",
    image: "/images/web-design-service.png"
  }
] as const;

export default async function ServicesPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "services" });

  return (
    <>
      <section className={styles.hero}>
        <Container>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>{t("overview.eyebrow")}</p>
            <h1>{t("overview.title")}</h1>
            <p className={styles.lead}>{t("overview.description")}</p>
          </div>
        </Container>
      </section>
      <section className={styles.servicesSection} aria-label={t("overview.title")}>
        <Container className={styles.grid}>
          {services.map((service) => (
            <Link
              className={styles.card}
              href={localizedPath(params.locale, service.href)}
              key={service.key}
            >
              <div className={styles.media}>
                <Image
                  src={service.image}
                  alt={t(`${service.key}.imageAlt`)}
                  fill
                  sizes="(min-width: 800px) 50vw, 100vw"
                  className={styles.image}
                />
              </div>
              <div className={styles.content}>
                <h2>{t(`${service.key}.title`)}</h2>
                <p>{t(`${service.key}.shortDescription`)}</p>
                <span className={styles.linkLabel}>
                  {t("overview.viewDetails")}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </Container>
      </section>
    </>
  );
}
