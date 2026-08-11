"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { ScholarshipExam as ScholarshipExamData } from "@/data/scholarship-exams";
import { scholarshipExamCopy } from "@/data/scholarship-exams";
import type { TrainingProgram } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize, localizedPath } from "@/lib/utilities/localize";
import styles from "./ScholarshipExam.module.css";

interface ScholarshipExamProps {
  locale: Locale;
  program: TrainingProgram;
  exam: ScholarshipExamData;
}

interface ApplicantInfo {
  fullName: string;
  email: string;
  telephone: string;
}

export function ScholarshipExam({ locale, program, exam }: ScholarshipExamProps) {
  const [applicant, setApplicant] = useState<ApplicantInfo>({
    fullName: "",
    email: "",
    telephone: ""
  });
  const [answers, setAnswers] = useState<Array<number | null>>(
    () => Array.from({ length: exam.questions.length }, () => null)
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [validationMessage, setValidationMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const answeredCount = answers.filter((answer) => answer !== null).length;
  const score = useMemo(
    () =>
      answers.reduce<number>(
        (total, answer, index) => total + (answer === exam.questions[index].answer ? 1 : 0),
        0
      ),
    [answers, exam.questions]
  );
  const percentage = Math.round((score / exam.questions.length) * 100);
  const question = exam.questions[questionIndex];
  const isApplicantComplete =
    applicant.fullName.trim() && applicant.email.trim() && applicant.telephone.trim();
  const canSubmit = isApplicantComplete && answeredCount === exam.questions.length;

  const setApplicantField = (field: keyof ApplicantInfo, value: string) => {
    setApplicant((current) => ({ ...current, [field]: value }));
    setValidationMessage("");
  };

  const selectAnswer = (answerIndex: number) => {
    setAnswers((current) =>
      current.map((answer, index) => (index === questionIndex ? answerIndex : answer))
    );
    setValidationMessage("");
  };

  const submitExam = () => {
    if (!canSubmit) {
      setValidationMessage(localize(scholarshipExamCopy.validation, locale));
      return;
    }

    setIsSubmitted(true);
  };

  return (
    <article className={styles.page}>
      <Link className={styles.backLink} href={localizedPath(locale, `/training/${program.slug}`)}>
        <ArrowLeft size={18} aria-hidden="true" />
        {localize(scholarshipExamCopy.back, locale)}
      </Link>

      <header className={styles.header}>
        <p>{localize(scholarshipExamCopy.label, locale)}</p>
        <h1>{localize(program.title, locale)}</h1>
        <span>{localize(scholarshipExamCopy.intro, locale)}</span>
      </header>

      {isSubmitted ? (
        <section className={styles.result} aria-live="polite">
          <CheckCircle2 size={44} aria-hidden="true" />
          <p>{localize(scholarshipExamCopy.completed, locale)}</p>
          <h2>
            {localize(scholarshipExamCopy.score, locale)}: {score} / {exam.questions.length}
          </h2>
          <strong>{percentage}%</strong>
          <span>{localize(scholarshipExamCopy.resultMessage, locale)}</span>
          <em>{localize(scholarshipExamCopy.localOnly, locale)}</em>
        </section>
      ) : (
        <div className={styles.examGrid}>
          <section className={styles.panel} aria-labelledby="applicant-heading">
            <h2 id="applicant-heading">{localize(scholarshipExamCopy.applicant, locale)}</h2>
            <div className={styles.fields}>
              <label>
                <span>{localize(scholarshipExamCopy.fullName, locale)} *</span>
                <input
                  value={applicant.fullName}
                  onChange={(event) => setApplicantField("fullName", event.target.value)}
                  autoComplete="name"
                />
              </label>
              <label>
                <span>{localize(scholarshipExamCopy.email, locale)} *</span>
                <input
                  type="email"
                  value={applicant.email}
                  onChange={(event) => setApplicantField("email", event.target.value)}
                  autoComplete="email"
                />
              </label>
              <label>
                <span>{localize(scholarshipExamCopy.telephone, locale)} *</span>
                <input
                  value={applicant.telephone}
                  onChange={(event) => setApplicantField("telephone", event.target.value)}
                  autoComplete="tel"
                />
              </label>
            </div>
          </section>

          <section className={styles.panel} aria-labelledby="question-heading">
            <div className={styles.progress}>
              <span>{localize(scholarshipExamCopy.progress, locale)}</span>
              <strong>
                {answeredCount} / {exam.questions.length}
              </strong>
            </div>
            <div className={styles.progressTrack} aria-hidden="true">
              <span style={{ inlineSize: `${(answeredCount / exam.questions.length) * 100}%` }} />
            </div>

            <p className={styles.questionCount}>
              {localize(scholarshipExamCopy.question, locale)} {questionIndex + 1}
            </p>
            <h2 id="question-heading" className={styles.question}>
              {localize(question.prompt, locale)}
            </h2>

            <div className={styles.options}>
              {question.options.map((option, answerIndex) => (
                <button
                  type="button"
                  key={option.en}
                  className={answers[questionIndex] === answerIndex ? styles.selected : ""}
                  onClick={() => selectAnswer(answerIndex)}
                >
                  {localize(option, locale)}
                </button>
              ))}
            </div>

            {validationMessage ? (
              <p className={styles.validation} role="alert">
                {validationMessage}
              </p>
            ) : null}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryAction}
                disabled={questionIndex === 0}
                onClick={() => setQuestionIndex((current) => Math.max(0, current - 1))}
              >
                {localize(scholarshipExamCopy.previous, locale)}
              </button>
              {questionIndex === exam.questions.length - 1 ? (
                <button type="button" className={styles.primaryAction} onClick={submitExam}>
                  {localize(scholarshipExamCopy.submit, locale)}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={() =>
                    setQuestionIndex((current) => Math.min(exam.questions.length - 1, current + 1))
                  }
                >
                  {localize(scholarshipExamCopy.next, locale)}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </article>
  );
}
