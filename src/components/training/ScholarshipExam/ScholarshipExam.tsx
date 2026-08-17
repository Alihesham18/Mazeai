"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { ScholarshipExam as ScholarshipExamData } from "@/data/scholarship-exams";
import { scholarshipExamCopy } from "@/data/scholarship-exams";
import type { TrainingProgram } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize, localizedPath } from "@/lib/utilities/localize";
import type { AuthProfile } from "@/lib/auth/types";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { CopyDiscountCode } from "@/components/account/CopyDiscountCode";
import { submitScholarshipExamAction } from "@/lib/scholarship/actions";
import type { ScholarshipSubmissionState } from "@/lib/scholarship/types";
import styles from "./ScholarshipExam.module.css";

interface ScholarshipExamProps {
  locale: Locale;
  program: TrainingProgram;
  exam: ScholarshipExamData;
  user: AuthProfile | null;
}

const initialSubmissionState: ScholarshipSubmissionState = { status: "idle" };

function SubmitButton({ canSubmit, locale }: { canSubmit: boolean; locale: Locale }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primaryAction} disabled={!canSubmit || pending}>
      {localize(pending ? scholarshipExamCopy.submitting : scholarshipExamCopy.submit, locale)}
    </button>
  );
}

export function ScholarshipExam({ locale, program, exam, user }: ScholarshipExamProps) {
  const [answers, setAnswers] = useState<Array<number | null>>(() =>
    Array.from({ length: exam.questions.length }, () => null)
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [validationMessage, setValidationMessage] = useState("");
  const [state, formAction] = useFormState(
    submitScholarshipExamAction.bind(null, program.slug),
    initialSubmissionState
  );

  const answeredCount = answers.filter((answer) => answer !== null).length;
  const question = exam.questions[questionIndex];
  const canSubmit = answeredCount === exam.questions.length;
  const loginPath = `${localizedPath(locale, "/login")}?next=${encodeURIComponent(
    localizedPath(locale, `/training/${program.slug}/scholarship`)
  )}`;

  const selectAnswer = (answerIndex: number) => {
    setAnswers((current) =>
      current.map((answer, index) => (index === questionIndex ? answerIndex : answer))
    );
    setValidationMessage("");
  };

  const validateSubmission = (event: FormEvent<HTMLFormElement>) => {
    if (!canSubmit) {
      event.preventDefault();
      setValidationMessage(localize(scholarshipExamCopy.validation, locale));
    }
  };

  const submittedAnswers = JSON.stringify(
    exam.questions.flatMap((examQuestion, index) => {
      const selectedOption = answers[index];
      return selectedOption === null ? [] : [{ questionId: examQuestion.id, selectedOption }];
    })
  );
  const actionError = state.message ? localize(scholarshipExamCopy[state.message], locale) : "";
  const result = state.status === "success" ? state.result : undefined;
  const resultStatus = result
    ? localize(
        result.status === "eligible"
          ? scholarshipExamCopy.eligible
          : result.status === "not_eligible"
            ? scholarshipExamCopy.notEligible
            : result.status === "under_review"
              ? scholarshipExamCopy.underReview
              : scholarshipExamCopy.completedStatus,
        locale
      )
    : "";

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

      {result ? (
        <section className={styles.result} aria-live="polite">
          <CheckCircle2 size={44} aria-hidden="true" />
          <p>{localize(scholarshipExamCopy.completed, locale)}</p>
          <h2>
            {localize(scholarshipExamCopy.score, locale)}: {result.score} / {result.totalQuestions}
          </h2>
          <strong>
            {localize(scholarshipExamCopy.percentage, locale)}: {result.percentage}%
          </strong>
          <span>{resultStatus}</span>
          {result.scholarshipPercentage !== null ? (
            <span>
              {localize(scholarshipExamCopy.scholarshipAward, locale)}:{" "}
              {result.scholarshipPercentage}%
            </span>
          ) : null}
          {result.discountReady && result.discountCode ? (
            <div className={styles.resultCode}>
              <span>{localize(scholarshipExamCopy.scholarshipDiscountReady, locale)}</span>
              <code className={styles.discountCode}>
                {localize(scholarshipExamCopy.discountCode, locale)}: {result.discountCode}
              </code>
              <CopyDiscountCode
                code={result.discountCode}
                copyLabel={localize(scholarshipExamCopy.copyCode, locale)}
                copiedLabel={localize(scholarshipExamCopy.copied, locale)}
              />
              <Link href={localizedPath(locale, "/account/profile")}>
                {localize(scholarshipExamCopy.redeemFromProfile, locale)}
              </Link>
            </div>
          ) : result.status === "eligible" ? (
            <span className={styles.resultWarning} role="alert">
              {localize(scholarshipExamCopy.scholarshipDiscountUnavailable, locale)}
            </span>
          ) : null}
          <span>{localize(scholarshipExamCopy.resultMessage, locale)}</span>
          <em>{localize(scholarshipExamCopy.resultSaved, locale)}</em>
        </section>
      ) : !user ? (
        <section className={styles.panel}>
          <Link className={styles.primaryAction} href={loginPath}>
            {localize(scholarshipExamCopy.loginToTakeExam, locale)}
          </Link>
        </section>
      ) : (
        <div className={styles.examGrid}>
          <section className={styles.panel} aria-labelledby="applicant-heading">
            <h2 id="applicant-heading">{localize(scholarshipExamCopy.applicant, locale)}</h2>
            <div className={styles.fields}>
              <label>
                <span>{localize(scholarshipExamCopy.fullName, locale)} *</span>
                <input value={user.fullName} autoComplete="name" readOnly />
              </label>
              <label>
                <span>{localize(scholarshipExamCopy.email, locale)} *</span>
                <input type="email" value={user.email} autoComplete="email" readOnly />
              </label>
              <label>
                <span>{localize(scholarshipExamCopy.telephone, locale)} *</span>
                <PhoneInput
                  name="profileTelephone"
                  value={user.telephone}
                  locale={locale}
                  disabled
                />
              </label>
            </div>
          </section>

          <form
            className={styles.panel}
            aria-labelledby="question-heading"
            action={formAction}
            onSubmit={validateSubmission}
          >
            <input type="hidden" name="answers" value={submittedAnswers} />
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
                  key={`${question.id}-${answerIndex}`}
                  className={answers[questionIndex] === answerIndex ? styles.selected : ""}
                  onClick={() => selectAnswer(answerIndex)}
                >
                  {localize(option, locale)}
                </button>
              ))}
            </div>

            {validationMessage || actionError ? (
              <p className={styles.validation} role="alert">
                {validationMessage || actionError}
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
                <SubmitButton canSubmit={canSubmit} locale={locale} />
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
          </form>
        </div>
      )}
    </article>
  );
}
