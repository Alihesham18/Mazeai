"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, X } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { localize, localizedPath } from "@/lib/utilities/localize";
import { formatTrainingFee, type TrainingProgram } from "@/data/training-programs";
import styles from "./ScholarshipExam.module.css";

interface ScholarshipExamProps {
  locale: Locale;
  program: TrainingProgram;
  className?: string;
}

const copy = {
  exam: {
    en: "Academy scholarship exam",
    tr: "Akademi bursluluk sınavı",
    ar: "اختبار منحة الأكاديمية"
  },
  open: { en: "Take the scholarship exam", tr: "Bursluluk sınavına gir", ar: "ابدأ اختبار المنحة" },
  close: {
    en: "Close scholarship exam",
    tr: "Bursluluk sınavını kapat",
    ar: "إغلاق اختبار المنحة"
  },
  progress: { en: "Progress", tr: "İlerleme", ar: "التقدم" },
  question: { en: "Question", tr: "Soru", ar: "السؤال" },
  completed: { en: "completed", tr: "tamamlandı", ar: "مكتمل" },
  next: { en: "Next question", tr: "Sonraki soru", ar: "السؤال التالي" },
  finish: { en: "See my result", tr: "Sonucumu gör", ar: "عرض النتيجة" },
  resultTitle: { en: "Exam completed", tr: "Sınav tamamlandı", ar: "اكتمل الاختبار" },
  correct: { en: "correct answers", tr: "doğru cevap", ar: "إجابات صحيحة" },
  discountAwarded: {
    en: "Scholarship discount awarded",
    tr: "Kazanılan burs indirimi",
    ar: "خصم المنحة الممنوح"
  },
  originalFee: {
    en: "Original tuition fee",
    tr: "Orijinal eğitim ücreti",
    ar: "رسوم التدريب الأصلية"
  },
  reduction: { en: "Scholarship reduction", tr: "Burs indirimi", ar: "قيمة خصم المنحة" },
  finalFee: { en: "Tuition with scholarship", tr: "Burslu eğitim ücreti", ar: "الرسوم بعد المنحة" },
  code: { en: "Scholarship code awarded", tr: "Kazanılan burs kodu", ar: "رمز المنحة الممنوح" },
  copyCode: { en: "Copy scholarship code", tr: "Burs kodunu kopyala", ar: "نسخ رمز المنحة" },
  copied: { en: "Copied", tr: "Kopyalandı", ar: "تم النسخ" },
  closeButton: { en: "Close", tr: "Kapat", ar: "إغلاق" },
  useCode: {
    en: "Use code in application",
    tr: "Kodu başvuruda kullan",
    ar: "استخدم الرمز في الطلب"
  }
} as const;

export function ScholarshipExam({ locale, program, className }: ScholarshipExamProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const question = program.scholarshipQuestions[questionIndex];
  const discount = score * 10;
  const reduction = Math.round(program.fee * (discount / 100));
  const finalFee = program.fee - reduction;
  const scholarshipCode = `SYNERGY-DSML-${discount || 0}`;

  useEffect(() => {
    if (!isOpen) return;

    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const resetExam = () => {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setIsComplete(false);
    setCopied(false);
  };

  const openExam = () => {
    resetExam();
    setIsOpen(true);
  };

  const selectAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);
    if (answerIndex === question.answer) setScore((current) => current + 1);
  };

  const advance = () => {
    if (selectedAnswer === null) return;
    if (questionIndex === program.scholarshipQuestions.length - 1) {
      setIsComplete(true);
      return;
    }
    setQuestionIndex((current) => current + 1);
    setSelectedAnswer(null);
  };

  const copyScholarshipCode = async () => {
    await navigator.clipboard.writeText(scholarshipCode);
    setCopied(true);
  };

  const useCode = () => {
    void navigator.clipboard.writeText(scholarshipCode);
    setIsOpen(false);
    const applicationPath = localizedPath(locale, `/training/${program.slug}`);
    window.location.assign(
      `${applicationPath}?scholarship=${encodeURIComponent(scholarshipCode)}#application`
    );
  };

  const answeredProgress = isComplete
    ? 100
    : Math.round((questionIndex / program.scholarshipQuestions.length) * 100);

  return (
    <>
      <button
        type="button"
        className={[styles.trigger, className].filter(Boolean).join(" ")}
        onClick={openExam}
      >
        {localize(copy.open, locale)}
      </button>

      {isOpen
        ? createPortal(
            <div
              className={styles.backdrop}
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setIsOpen(false);
              }}
            >
              <section
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
              >
                <header className={styles.dialogHeader}>
                  <div>
                    <p>{localize(copy.exam, locale)}</p>
                    <h2 id={titleId}>{localize(program.title, locale)}</h2>
                  </div>
                  <button
                    ref={closeRef}
                    type="button"
                    className={styles.close}
                    aria-label={localize(copy.close, locale)}
                    onClick={() => setIsOpen(false)}
                  >
                    <X aria-hidden="true" />
                  </button>
                </header>

                {isComplete ? (
                  <div className={styles.result}>
                    <span className={styles.resultIcon} aria-hidden="true">
                      <Check />
                    </span>
                    <h3>{localize(copy.resultTitle, locale)}</h3>
                    <p>
                      {score} / {program.scholarshipQuestions.length}{" "}
                      {localize(copy.correct, locale)}
                    </p>

                    <dl className={styles.feeSummary}>
                      <div className={styles.discountRow}>
                        <dt>{localize(copy.discountAwarded, locale)}</dt>
                        <dd>{discount}%</dd>
                      </div>
                      <div>
                        <dt>{localize(copy.originalFee, locale)}</dt>
                        <dd>{formatTrainingFee(program.fee)}</dd>
                      </div>
                      <div>
                        <dt>{localize(copy.reduction, locale)}</dt>
                        <dd>- {formatTrainingFee(reduction)}</dd>
                      </div>
                      <div className={styles.finalRow}>
                        <dt>{localize(copy.finalFee, locale)}</dt>
                        <dd>{formatTrainingFee(finalFee)}</dd>
                      </div>
                    </dl>

                    <div className={styles.codeBlock}>
                      <p>{localize(copy.code, locale)}</p>
                      <div>
                        <code>{scholarshipCode}</code>
                        <button
                          type="button"
                          onClick={copyScholarshipCode}
                          aria-label={localize(copy.copyCode, locale)}
                        >
                          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                          <span>
                            {copied
                              ? localize(copy.copied, locale)
                              : localize(copy.copyCode, locale)}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className={styles.resultActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => setIsOpen(false)}
                      >
                        {localize(copy.closeButton, locale)}
                      </button>
                      <button type="button" className={styles.primaryButton} onClick={useCode}>
                        {localize(copy.useCode, locale)}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.examBody}>
                    <div className={styles.progressLabel}>
                      <span>
                        {localize(copy.progress, locale)}: {localize(copy.question, locale)}{" "}
                        {questionIndex + 1} / {program.scholarshipQuestions.length}
                      </span>
                      <strong>
                        {answeredProgress}% {localize(copy.completed, locale)}
                      </strong>
                    </div>
                    <div className={styles.progressTrack} aria-hidden="true">
                      <span style={{ inlineSize: `${Math.max(answeredProgress, 8)}%` }} />
                    </div>

                    <h3 className={styles.question}>{localize(question.prompt, locale)}</h3>
                    <div className={styles.options}>
                      {question.options.map((answer, answerIndex) => {
                        const isSelected = selectedAnswer === answerIndex;
                        const isCorrect =
                          selectedAnswer !== null && answerIndex === question.answer;
                        const isWrong = isSelected && answerIndex !== question.answer;

                        return (
                          <button
                            type="button"
                            className={[
                              styles.option,
                              isCorrect ? styles.correct : "",
                              isWrong ? styles.wrong : ""
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            disabled={selectedAnswer !== null}
                            onClick={() => selectAnswer(answerIndex)}
                            key={answer.en}
                          >
                            <span>{localize(answer, locale)}</span>
                            {isCorrect ? (
                              <Check aria-hidden="true" />
                            ) : isWrong ? (
                              <X aria-hidden="true" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className={styles.nextButton}
                      disabled={selectedAnswer === null}
                      onClick={advance}
                    >
                      {localize(
                        questionIndex === program.scholarshipQuestions.length - 1
                          ? copy.finish
                          : copy.next,
                        locale
                      )}
                    </button>
                  </div>
                )}
              </section>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
