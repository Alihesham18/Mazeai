import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { pageShells, getPageShell } from "@/data/page-shells";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./page.module.css";

interface ShellPageProps {
  params: {
    locale: Locale;
    slug: string[];
  };
}

export function generateStaticParams() {
  const locales: Locale[] = ["en", "tr", "ar"];
  const knownPaths = [
    ...pageShells.map((page) => page.path),
    "services/ai-consulting",
    "services/ai-solutions-automation",
    "services/research-development",
    "services/education-training",
    "services/academic-partnerships",
    "services/custom-programs",
    "research/areas",
    "research/projects",
    "research/projects/learning-analytics-lab",
    "research/publications",
    "research/innovation-lab",
    "research/partnerships",
    "events/ai-strategy-roundtable",
    "events/ai-strategy-roundtable/register",
    "events/ai-strategy-roundtable/registration-success",
    "training/ai-foundations",
    "training/ai-foundations/apply",
    "training/ai-foundations/booking-request",
    "training/ai-foundations/application-success",
    "case-studies/sample-ai-operations",
    "blog/responsible-ai-starting-points",
    "about/mission-vision",
    "about/our-story",
    "about/team/sample-profile",
    "about/partners/sample-partner",
    "about/responsible-ai",
    "about/careers"
  ];

  return locales.flatMap((locale) =>
    knownPaths.map((path) => ({
      locale,
      slug: path.split("/")
    }))
  );
}

export async function generateMetadata({ params }: ShellPageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale });
  const shell = getPageShell(params.slug.join("/"));

  return {
    title: `${t(shell.titleKey)} | SynergyMazeAI`,
    description: t(shell.descriptionKey),
    alternates: {
      canonical: `/${params.locale}/${params.slug.join("/")}`
    }
  };
}

export default async function ShellPage({ params }: ShellPageProps) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale });
  const path = params.slug.join("/");
  const shell = getPageShell(path);

  return (
    <Section className={styles.hero}>
      <Container className={styles.wrap}>
        <div>
          <Badge>{t("common.placeholder")}</Badge>
          <h1>{t(shell.titleKey)}</h1>
          <p className={styles.lead}>{t(shell.descriptionKey)}</p>
        </div>
        <div className={styles.grid}>
          <Card>
            <h2>{t("common.sectionsIncluded")}</h2>
            <ul className={styles.sectionList}>
              {shell.sections.map((section) => (
                <li key={section}>{section}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2>SynergyMazeAI</h2>
            <p>{t("common.phaseNote")}</p>
            <Button href={localizedPath(params.locale, "/contact")}>{t("navigation.partner")}</Button>
          </Card>
        </div>
        {path.includes("privacy") || path.includes("cookies") || path.includes("terms") || path.includes("personal-data") ? (
          <p className={styles.notice}>{t(shell.descriptionKey)}</p>
        ) : null}
      </Container>
    </Section>
  );
}
