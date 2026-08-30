import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/routing";
import type { TeamReadResult, TeamMember } from "@/lib/directus/team";
import { localizedPath } from "@/lib/utilities/localize";
import { TeamCard } from "./TeamCard";
import styles from "./TeamPage.module.css";

const knownCategories = [
  "leadership",
  "research_advisory",
  "research",
  "engineering",
  "education",
  "operations"
] as const;

function isKnownCategory(value: string): value is (typeof knownCategories)[number] {
  return knownCategories.includes(value as (typeof knownCategories)[number]);
}

export async function TeamPage({
  locale,
  result
}: {
  locale: Locale;
  result: TeamReadResult<TeamMember[]>;
}) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.team" });
  const members = result.ok ? result.data : [];
  const heroTitle = t("hero.title");
  const brandName = "MazeAI";
  const brandIndex = heroTitle.lastIndexOf(brandName);

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="team-page-heading">
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.orbit} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <Container className={styles.heroInner}>
          <nav className={styles.breadcrumbs} aria-label={t("breadcrumb.label")}>
            <Link href={localizedPath(locale, "/")}>{t("breadcrumb.home")}</Link>
            <span aria-hidden="true">/</span>
            <Link href={localizedPath(locale, "/about")}>{t("breadcrumb.about")}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{t("breadcrumb.current")}</span>
          </nav>

          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{t("hero.eyebrow")}</p>
            <h1 id="team-page-heading">
              {brandIndex >= 0 ? (
                <>
                  {brandIndex > 0 ? <span>{heroTitle.slice(0, brandIndex)}</span> : null}
                  <span>
                    <span className={styles.heroAccent}>{brandName}</span>
                    {heroTitle.slice(brandIndex + brandName.length)}
                  </span>
                </>
              ) : (
                heroTitle
              )}
            </h1>
            <p>{t("hero.description")}</p>
          </div>
        </Container>
      </section>

      <section className={styles.teamSection} aria-labelledby="meet-team-heading">
        <Container>
          <header className={styles.sectionHeader}>
            <p className={styles.eyebrow}>{t("directory.eyebrow")}</p>
            <div>
              <h2 id="meet-team-heading">{t("directory.title")}</h2>
              <p>{t("directory.description")}</p>
            </div>
          </header>

          {!result.ok ? (
            <div className={styles.status} role="status">
              <strong>{t("failure.title")}</strong>
              <p>{t("failure.description")}</p>
            </div>
          ) : members.length === 0 ? (
            <div className={styles.status} role="status">
              <strong>{t("empty.title")}</strong>
              <p>{t("empty.description")}</p>
            </div>
          ) : (
            <div className={styles.teamGrid} data-testid="team-grid">
              {members.map((member, index) => (
                <TeamCard
                  key={member.id}
                  member={member}
                  index={index}
                  categoryLabel={
                    isKnownCategory(member.category)
                      ? t(`categories.${member.category}`)
                      : member.category
                  }
                  linkedinLabel={t("linkedin.label")}
                  linkedinAriaLabel={t("linkedin.ariaLabel", { name: member.fullName })}
                />
              ))}
            </div>
          )}
        </Container>
      </section>

      <section className={styles.ctaSection} aria-labelledby="team-cta-heading">
        <Container>
          <div className={styles.cta}>
            <div>
              <p className={styles.eyebrow}>{t("cta.eyebrow")}</p>
              <h2 id="team-cta-heading">{t("cta.title")}</h2>
              <p>{t("cta.description")}</p>
            </div>
            <Link className={styles.ctaLink} href={localizedPath(locale, "/contact")}>
              {t("cta.button")}
              <ArrowUpRight className={styles.directionalIcon} size={18} aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
