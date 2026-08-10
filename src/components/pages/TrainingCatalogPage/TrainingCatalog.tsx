"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { ScholarshipExam } from "@/components/training/ScholarshipExam";
import { TrainingProgramImage } from "@/components/training/TrainingProgramImage";
import { formatTrainingFee, trainingCopy, trainingPrograms } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize, localizedPath } from "@/lib/utilities/localize";
import styles from "./TrainingCatalogPage.module.css";

type TrainingCategory = "bootcamp" | "short-course";

export function TrainingCatalog({ locale }: { locale: Locale }) {
  const [category, setCategory] = useState<TrainingCategory>("bootcamp");
  const programs = trainingPrograms.filter((program) => program.category === category);

  return (
    <>
      <div className={styles.segmentedControl} aria-label={localize(trainingCopy.title, locale)}>
        <button
          type="button"
          className={category === "bootcamp" ? styles.selected : ""}
          aria-pressed={category === "bootcamp"}
          onClick={() => setCategory("bootcamp")}
        >
          {localize(trainingCopy.bootcamps, locale)}
        </button>
        <button
          type="button"
          className={category === "short-course" ? styles.selected : ""}
          aria-pressed={category === "short-course"}
          onClick={() => setCategory("short-course")}
        >
          {localize(trainingCopy.shortCourses, locale)}
        </button>
      </div>

      {programs.length ? (
        <div className={styles.programGrid} aria-live="polite">
          {programs.map((program) => {
            const detailPath = localizedPath(locale, `/training/${program.slug}`);

            return (
              <article className={styles.programCard} key={program.slug}>
                <Link
                  className={styles.posterLink}
                  href={detailPath}
                  aria-label={localize(program.title, locale)}
                >
                  <TrainingProgramImage
                    className={styles.poster}
                    src={program.image}
                    alt={localize(program.imageAlt, locale)}
                    sizes="(min-width: 800px) 33vw, 100vw"
                  >
                    <span className={styles.posterFallback} aria-hidden="true">
                      <strong>{localize(program.title, locale)}</strong>
                      <span>{program.instructor}</span>
                    </span>
                  </TrainingProgramImage>
                  <span className={styles.posterBadges} aria-hidden="true">
                    <span>{localize(program.format, locale)}</span>
                    <span>{localize(program.duration, locale)}</span>
                  </span>
                </Link>

                <div className={styles.cardBody}>
                  <h2>
                    <Link href={detailPath}>{localize(program.title, locale)}</Link>
                  </h2>
                  <p>{localize(program.shortDescription, locale)}</p>

                  <div className={styles.cardMeta}>
                    <div>
                      <span className={styles.initials} aria-hidden="true">
                        MT
                      </span>
                      <p>
                        <strong>{program.instructor}</strong>
                        <span>{localize(program.instructorRole, locale)}</span>
                      </p>
                    </div>
                    <div className={styles.fee}>
                      <span>{localize(trainingCopy.tuition, locale)}</span>
                      <strong>{formatTrainingFee(program.fee)}</strong>
                    </div>
                  </div>

                  <Link className={styles.detailLink} href={detailPath}>
                    {localize(trainingCopy.review, locale)}
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>

                  <div
                    className={[
                      styles.cardActions,
                      program.scholarshipQuestions.length === 0 ? styles.singleAction : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <Link href={`${detailPath}#application`}>
                      {localize(trainingCopy.preregister, locale)}
                    </Link>
                    {program.scholarshipQuestions.length > 0 ? (
                      <ScholarshipExam
                        locale={locale}
                        program={program}
                        className={styles.examButton}
                      />
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className={styles.emptyState} aria-live="polite">
          {localize(trainingCopy.shortCoursesEmpty, locale)}
        </p>
      )}
    </>
  );
}
