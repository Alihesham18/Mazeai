import { ArrowUpRight, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { FooterMobileNavigation } from "./FooterMobileNavigation";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { TechnicalDetail } from "@/components/ui/TechnicalDetail";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./Footer.module.css";

const footerGroups = [
  {
    id: "company",
    titleKey: "footer.company",
    links: [
      ["navigation.companyOverview", "/about"],
      ["navigation.team", "/about/team"],
      ["navigation.partners", "/about/partners"],
      ["navigation.contact", "/contact"]
    ]
  },
  {
    id: "solutions",
    titleKey: "footer.solutions",
    links: [
      ["navigation.servicesOverview", "/services"],
      ["navigation.researchOverview", "/research"],
      ["navigation.training", "/training"]
    ]
  },
  {
    id: "resources",
    titleKey: "footer.resources",
    links: [
      ["navigation.caseStudies", "/case-studies"],
      ["navigation.events", "/events"],
      ["navigation.blog", "/blog"]
    ]
  },
  {
    id: "legal",
    titleKey: "footer.legal",
    links: [
      ["pages.privacy.title", "/privacy"],
      ["pages.cookies.title", "/cookies"],
      ["pages.terms.title", "/terms"],
      ["pages.personalData.title", "/personal-data-notice"]
    ]
  }
] as const;

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });
  const localizedGroups = footerGroups.map((group) => ({
    id: group.id,
    title: t(group.titleKey),
    links: group.links.map(([labelKey, href]) => ({
      label: t(labelKey),
      href: localizedPath(locale, href)
    }))
  }));

  return (
    <footer className={styles.footer}>
      <TechnicalDetail variant="dots" className={styles.dotField} />
      <Container size="wide">
        <div className={styles.frame}>
          <TechnicalDetail variant="mazeCorner" className={styles.frameCorner} />
          <div className={styles.mainGrid}>
            <section className={styles.brandBlock} aria-label={siteConfig.name}>
              <Logo locale={locale} />
              <p className={styles.description}>{t("footer.description")}</p>
              <TechnicalDetail variant="line" className={styles.brandLine} />
            </section>

            <nav className={styles.desktopNavigation} aria-label={t("footer.navigationLabel")}>
              {localizedGroups.map((group) => (
                <section className={styles.navigationGroup} key={group.id}>
                  <h2 className={styles.groupTitle}>{group.title}</h2>
                  <div className={styles.links}>
                    {group.links.map((link) => (
                      <a key={link.href} href={link.href}>
                        {link.label}
                      </a>
                    ))}
                  </div>
                </section>
              ))}
            </nav>

            <FooterMobileNavigation
              ariaLabel={t("footer.mobileNavigationLabel")}
              groups={localizedGroups}
            />

            <section className={styles.contactPanel} aria-labelledby="footer-contact-heading">
              <TechnicalDetail variant="mazeCorner" className={styles.contactCorner} />
              <h2 className={styles.contactTitle} id="footer-contact-heading">
                {t("footer.getInTouch")}
              </h2>
              <a className={styles.emailLink} href={`mailto:${siteConfig.email}`} dir="ltr">
                <Mail aria-hidden="true" size={18} strokeWidth={1.7} />
                <span>{siteConfig.email}</span>
              </a>
              <Button
                href={localizedPath(locale, "/contact")}
                variant="outline"
                className={styles.contactButton}
              >
                {t("navigation.partner")}
                <ArrowUpRight aria-hidden="true" className={styles.directionalIcon} size={17} />
              </Button>
            </section>
          </div>

          <div className={styles.bottomBar}>
            <p>{t("footer.copyright")}</p>
            <TechnicalDetail variant="circuit" className={styles.bottomCircuit} />
            <span className={styles.bottomBrand}>{siteConfig.name}</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
