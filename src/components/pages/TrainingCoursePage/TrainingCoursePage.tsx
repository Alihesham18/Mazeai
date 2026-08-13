import Link from "next/link";
import { Award, Banknote, Clock3, GraduationCap, MapPin, Monitor, MoveLeft } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { TrainingApplicationForm } from "@/components/training/TrainingApplicationForm";
import { TrainingCurriculum } from "@/components/training/TrainingCurriculum";
import { TrainingProgramImage } from "@/components/training/TrainingProgramImage";
import { TrainingTimeline } from "@/components/training/TrainingTimeline";
import { getScholarshipExam, scholarshipExamCopy } from "@/data/scholarship-exams";
import { formatTrainingFee, trainingCopy, type TrainingProgram } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize, localizedPath } from "@/lib/utilities/localize";
import type { AuthProfile } from "@/lib/auth/types";
import styles from "./TrainingCoursePage.module.css";

export function TrainingCoursePage({
  locale,
  program,
  user
}: {
  locale: Locale;
  program: TrainingProgram;
  user: AuthProfile | null;
}) {
  setRequestLocale(locale);
  const scholarshipPath = localizedPath(locale, `/training/${program.slug}/scholarship`);
  const hasScholarshipExam = program.category === "bootcamp" && getScholarshipExam(program.slug);
  const applicationPath = localizedPath(locale, `/training/${program.slug}#application`);
  const loginPath = `${localizedPath(locale, "/login")}?next=${encodeURIComponent(applicationPath)}`;

  const facts = [
    { icon: Clock3, label: trainingCopy.duration, value: program.duration },
    { icon: MapPin, label: trainingCopy.location, value: program.location },
    { icon: Monitor, label: trainingCopy.format, value: program.format },
    {
      icon: GraduationCap,
      label: trainingCopy.instructor,
      value: {
        en: program.instructor,
        tr: program.instructor,
        ar: program.instructor,
        fa: program.instructor
      }
    },
    {
      icon: Banknote,
      label: trainingCopy.fee,
      value: {
        en: formatTrainingFee(program.fee),
        tr: formatTrainingFee(program.fee),
        ar: formatTrainingFee(program.fee),
        fa: formatTrainingFee(program.fee)
      }
    },
    {
      icon: Award,
      label: trainingCopy.certificate,
      value: program.certificate ? trainingCopy.certificateYes : { en: "No", tr: "Hayır", ar: "لا" }
    }
  ];

  return (
    <article>
      <header className={styles.hero}>
        <Container>
          <Link className={styles.backLink} href={localizedPath(locale, "/training")}>
            <MoveLeft size={18} aria-hidden="true" />
            {localize(trainingCopy.allPrograms, locale)}
          </Link>

          <div className={styles.heroGrid}>
            <div>
              <p className={styles.eyebrow}>{localize(trainingCopy.bootcamps, locale)}</p>
              <h1>{localize(program.title, locale)}</h1>
              <p className={styles.lead}>{localize(program.shortDescription, locale)}</p>

              <dl className={styles.facts}>
                {facts.map(({ icon: Icon, label, value }) => (
                  <div key={label.en}>
                    <dt>
                      <Icon size={19} aria-hidden="true" />
                      {localize(label, locale)}
                    </dt>
                    <dd>{localize(value, locale)}</dd>
                  </div>
                ))}
              </dl>

              <p className={styles.hours}>{localize(program.hoursBreakdown, locale)}</p>
              <div className={styles.heroActions}>
                {program.applicationOpen ? (
                  <Link className={styles.primaryAction} href={user ? "#application" : loginPath}>
                    {localize(user ? trainingCopy.apply : trainingCopy.loginToApply, locale)}
                  </Link>
                ) : (
                  <span className={[styles.primaryAction, styles.disabledAction].join(" ")}>
                    {localize(
                      program.directusAvailable
                        ? trainingCopy.applicationClosed
                        : trainingCopy.programUnavailable,
                      locale
                    )}
                  </span>
                )}
                <Link
                  className={styles.secondaryAction}
                  href={localizedPath(locale, "/contact")}
                >
                  {localize(trainingCopy.getInfo, locale)}
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
                alt={localize(program.imageAlt, locale)}
                priority
                sizes="(min-width: 980px) 46vw, 100vw"
              >
                <span className={styles.mediaFallback} aria-hidden="true">
                  <strong>{localize(program.title, locale)}</strong>
                  <span>{program.instructor}</span>
                </span>
              </TrainingProgramImage>
            </div>
          </div>
        </Container>
      </header>

      <section
        className={styles.aboutSection}
        id="about-program"
        aria-labelledby="about-program-heading"
      >
        <Container>
          <div className={styles.sectionHeading}>
            <p>{localize(trainingCopy.explanation, locale)}</p>
            <h2 id="about-program-heading">{localize(trainingCopy.about, locale)}</h2>
          </div>
          <p className={styles.aboutText}>{localize(program.description, locale)}</p>
        </Container>
      </section>

      <TrainingCurriculum locale={locale} program={program} />
      <TrainingTimeline locale={locale} program={program} />

      <section
        className={styles.applicationSection}
        id="application"
        aria-labelledby="application-heading"
      >
        <Container>
          <div className={styles.sectionHeading}>
            <p>{localize(trainingCopy.application, locale)}</p>
            <h2 id="application-heading">{localize(trainingCopy.preRegisterTitle, locale)}</h2>
            <span>{localize(trainingCopy.preRegisterDescription, locale)}</span>
          </div>
          <TrainingApplicationForm locale={locale} program={program} user={user} />
        </Container>
      </section>
    </article>
  );
}
