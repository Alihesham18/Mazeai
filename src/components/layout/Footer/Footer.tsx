import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import { siteConfig } from "@/config/site";
import styles from "./Footer.module.css";

const footerGroups = [
  {
    titleKey: "footer.services",
    links: [
      ["navigation.aiConsulting", "/services/ai-consulting"],
      ["navigation.aiSolutions", "/services/ai-solutions-automation"],
      ["navigation.educationTraining", "/services/education-training"]
    ]
  },
  {
    titleKey: "footer.research",
    links: [
      ["navigation.researchAreas", "/research/areas"],
      ["navigation.currentProjects", "/research/projects"],
      ["navigation.publications", "/research/publications"]
    ]
  },
  {
    titleKey: "footer.legal",
    links: [
      ["pages.privacy.title", "/privacy"],
      ["pages.cookies.title", "/cookies"],
      ["pages.terms.title", "/terms"],
      ["pages.personalData.title", "/personal-data-notice"]
    ]
  }
];

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.grid}>
          <div>
            <Logo locale={locale} />
            <p className={styles.description}>{t("footer.description")}</p>
            <p className={styles.muted} dir="ltr">
              {siteConfig.email}
            </p>
          </div>
          <div className={styles.columns}>
            {footerGroups.map((group) => (
              <div key={group.titleKey}>
                <p className={styles.groupTitle}>{t(group.titleKey)}</p>
                <div className={styles.links}>
                  {group.links.map(([labelKey, href]) => (
                    <a key={href} href={localizedPath(locale, href)}>
                      {t(labelKey)}
                    </a>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <p className={styles.groupTitle}>{t("footer.social")}</p>
              <p className={styles.muted}>LinkedIn · X · YouTube</p>
            </div>
          </div>
        </div>
        <p className={styles.bottom}>{t("footer.copyright")}</p>
      </Container>
    </footer>
  );
}
