"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { TrainingProgramImage } from "@/components/training/TrainingProgramImage";
import { getScholarshipExam, scholarshipExamCopy } from "@/data/scholarship-exams";
import type { Locale } from "@/i18n/routing";
import type { PublicTrainingProgram } from "@/lib/training/types";
import { formatTrainingFee } from "@/lib/utilities/currency";
import { localize, localizedPath } from "@/lib/utilities/localize";
import styles from "./TrainingCatalogPage.module.css";

type TrainingCategory = "bootcamp" | "short-course";

function getInstructorInitials(instructor: string) {
  const parts = instructor
    .replace(/^Dr\.\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function TrainingCatalog({
  locale,
  programs: allPrograms,
  authenticated
}: {
  locale: Locale;
  programs: readonly PublicTrainingProgram[];
  authenticated: boolean;
}) {
  const t = useTranslations("training");
  const [category, setCategory] = useState<TrainingCategory>("bootcamp");
  const programs = allPrograms.filter((program) => program.category === category);

  return (
    <>
      <div className={styles.segmentedControl} aria-label={t("title")}>
        <button
          type="button"
          className={category === "bootcamp" ? styles.selected : ""}
          aria-pressed={category === "bootcamp"}
          onClick={() => setCategory("bootcamp")}
        >
          {t("bootcamps")}
        </button>
        <button
          type="button"
          className={category === "short-course" ? styles.selected : ""}
          aria-pressed={category === "short-course"}
          onClick={() => setCategory("short-course")}
        >
          {t("shortCourses")}
        </button>
      </div>

      {programs.length ? (
        <div className={styles.programGrid} aria-live="polite">
          {programs.map((program) => {
            const detailPath = localizedPath(locale, `/training/${program.slug}`);
            const applicationPath = `${detailPath}#application`;
            const preregistrationPath = authenticated
              ? applicationPath
              : `${localizedPath(locale, "/login")}?next=${encodeURIComponent(applicationPath)}`;
            const scholarshipPath = localizedPath(locale, `/training/${program.slug}/scholarship`);
            const hasScholarshipExam = program.category === "bootcamp" && getScholarshipExam(program.slug);

            return (
              <article className={styles.programCard} key={program.slug}>
                <Link
                  className={styles.posterLink}
                  href={detailPath}
                  aria-label={program.title}
                >
                  <TrainingProgramImage
                    className={styles.poster}
                    src={program.image}
                    alt={program.imageAlt ?? ""}
                    sizes="(min-width: 800px) 33vw, 100vw"
                  >
                    <span className={styles.posterFallback} aria-hidden="true">
                      <strong>{program.title}</strong>
                      {program.instructor ? <span>{program.instructor}</span> : null}
                    </span>
                  </TrainingProgramImage>
                  <span className={styles.posterBadges} aria-hidden="true">
                    {program.format ? <span>{program.format}</span> : null}
                    {program.durationHours !== null ? (
                      <span>{t("hours", { count: program.durationHours })}</span>
                    ) : null}
                  </span>
                </Link>

                <div className={styles.cardBody}>
                  <h2>
                    <Link href={detailPath}>{program.title}</Link>
                  </h2>
                  {program.shortDescription ? <p>{program.shortDescription}</p> : null}

                  <div className={styles.cardBottom}>
                    <div className={styles.cardMeta}>
                      {program.instructor ? <div>
                        <span className={styles.initials} aria-hidden="true">
                          {getInstructorInitials(program.instructor)}
                        </span>
                        <p>
                          <strong>{program.instructor}</strong>
                          {program.instructorRole ? <span>{program.instructorRole}</span> : null}
                        </p>
                      </div> : null}
                      {program.fee !== null && program.currency ? (
                        <div className={styles.fee}>
                          <span>{t("tuition")}</span>
                          <strong>{formatTrainingFee(program.fee, locale, program.currency)}</strong>
                        </div>
                      ) : null}
                    </div>

                    <Link className={styles.detailLink} href={detailPath}>
                      {t("review")}
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </Link>

                    <div
                      className={[
                        styles.cardActions,
                        !hasScholarshipExam ? styles.singleAction : ""
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {program.applicationOpen ? (
                        <Link href={preregistrationPath}>
                          {t(authenticated ? "preregister" : "loginToApply")}
                        </Link>
                      ) : (
                        <span className={styles.closedAction}>
                          {t("applicationClosed")}
                        </span>
                      )}
                      {hasScholarshipExam ? (
                        <Link className={styles.examButton} href={scholarshipPath}>
                          {localize(scholarshipExamCopy.takeTest, locale)}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className={styles.emptyState} aria-live="polite">
          {t("categoryEmpty")}
        </p>
      )}
    </>
  );
}
