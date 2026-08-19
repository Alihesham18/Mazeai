import Link from "next/link";
import { Award, Banknote, Clock3, GraduationCap, MapPin, Monitor, MoveLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { TrainingApplicationForm } from "@/components/training/TrainingApplicationForm";
import { TrainingCurriculum } from "@/components/training/TrainingCurriculum";
import { TrainingProgramImage } from "@/components/training/TrainingProgramImage";
import { TrainingTimeline } from "@/components/training/TrainingTimeline";
import { getScholarshipExam, scholarshipExamCopy } from "@/data/scholarship-exams";
import type { Locale } from "@/i18n/routing";
import type { PublicTrainingProgram } from "@/lib/training/types";
import { formatTrainingFee } from "@/lib/utilities/currency";
import { localize, localizedPath } from "@/lib/utilities/localize";
import type { AuthProfile } from "@/lib/auth/types";
import styles from "./TrainingCoursePage.module.css";

export async function TrainingCoursePage({
  locale,
  program,
  user
}: {
  locale: Locale;
  program: PublicTrainingProgram;
  user: AuthProfile | null;
}) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "training" });
  const scholarshipPath = localizedPath(locale, `/training/${program.slug}/scholarship`);
  const hasScholarshipExam = program.category === "bootcamp" && getScholarshipExam(program.slug);
  const applicationPath = localizedPath(locale, `/training/${program.slug}#application`);
  const loginPath = `${localizedPath(locale, "/login")}?next=${encodeURIComponent(applicationPath)}`;

  const facts = [
    {
      icon: Clock3,
      label: t("duration"),
      value: program.durationHours === null ? null : t("hours", { count: program.durationHours })
    },
    { icon: MapPin, label: t("location"), value: program.location },
    { icon: Monitor, label: t("format"), value: program.format },
    {
      icon: GraduationCap,
      label: t("instructor"),
      value: program.instructor
    },
    {
      icon: Banknote,
      label: t("fee"),
      value:
        program.fee !== null && program.currency
          ? formatTrainingFee(program.fee, locale, program.currency)
          : null
    },
    {
      icon: Award,
      label: t("certificate"),
      value: program.certificate ? t("certificateYes") : t("certificateNo")
    }
  ].filter((fact): fact is { icon: typeof Clock3; label: string; value: string } => Boolean(fact.value));

  return (
    <article>
      <header className={styles.hero}>
        <Container>
          <Link className={styles.backLink} href={localizedPath(locale, "/training")}>
            <MoveLeft size={18} aria-hidden="true" />
            {t("allPrograms")}
          </Link>

          <div className={styles.heroGrid}>
            <div>
              <p className={styles.eyebrow}>
                {t(program.category === "bootcamp" ? "bootcamps" : "shortCourses")}
              </p>
              <h1>{program.title}</h1>
              {program.shortDescription ? <p className={styles.lead}>{program.shortDescription}</p> : null}

              <dl className={styles.facts}>
                {facts.map(({ icon: Icon, label, value }) => (
                  <div key={label}>
                    <dt>
                      <Icon size={19} aria-hidden="true" />
                      {label}
                    </dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>

              {program.hoursBreakdown ? <p className={styles.hours}>{program.hoursBreakdown}</p> : null}
              <div className={styles.heroActions}>
                {program.applicationOpen ? (
                  <Link className={styles.primaryAction} href={user ? "#application" : loginPath}>
                    {t(user ? "apply" : "loginToApply")}
                  </Link>
                ) : (
                  <span className={[styles.primaryAction, styles.disabledAction].join(" ")}>
                    {t("applicationClosed")}
                  </span>
                )}
                <Link
                  className={styles.secondaryAction}
                  href={localizedPath(locale, "/contact")}
                >
                  {t("getInfo")}
                </Link>
                {hasScholarshipExam ? (
                  <Link className={styles.examAction} href={scholarshipPath}>
                    {localize(scholarshipExamCopy.takeTest, locale)}
                  </Link>
                ) : null}
              </div>
            </div>

            <div className={styles.heroMedia}>
              <TrainingProgramImage
                src={program.image}
                alt={program.imageAlt ?? ""}
                priority
                sizes="(min-width: 980px) 46vw, 100vw"
              >
                <span className={styles.mediaFallback} aria-hidden="true">
                  <strong>{program.title}</strong>
                  {program.instructor ? <span>{program.instructor}</span> : null}
                </span>
              </TrainingProgramImage>
            </div>
          </div>
        </Container>
      </header>

      {program.description ? <section
        className={styles.aboutSection}
        id="about-program"
        aria-labelledby="about-program-heading"
      >
        <Container>
          <div className={styles.sectionHeading}>
            <p>{t("explanation")}</p>
            <h2 id="about-program-heading">{t("about")}</h2>
          </div>
          <p className={styles.aboutText}>{program.description}</p>
        </Container>
      </section> : null}

      <TrainingCurriculum locale={locale} program={program} />
      <TrainingTimeline locale={locale} program={program} />

      <section
        className={styles.applicationSection}
        id="application"
        aria-labelledby="application-heading"
      >
        <Container>
          <div className={styles.sectionHeading}>
            <p>{t("application")}</p>
            <h2 id="application-heading">{t("preRegisterTitle")}</h2>
            <span>{t("preRegisterDescription")}</span>
          </div>
          <TrainingApplicationForm locale={locale} program={program} user={user} />
        </Container>
      </section>
    </article>
  );
}
