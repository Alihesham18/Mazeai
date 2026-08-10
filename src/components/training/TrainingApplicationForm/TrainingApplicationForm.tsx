"use client";

import { useEffect, useState, type FormEvent } from "react";
import { trainingCopy, type TrainingProgram } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/utilities/localize";
import styles from "./TrainingApplicationForm.module.css";

export function TrainingApplicationForm({
  locale,
  program
}: {
  locale: Locale;
  program: TrainingProgram;
}) {
  const [scholarshipCode, setScholarshipCode] = useState("");
  const [showDevelopmentNotice, setShowDevelopmentNotice] = useState(false);

  useEffect(() => {
    setScholarshipCode(new URLSearchParams(window.location.search).get("scholarship") ?? "");
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowDevelopmentNotice(true);
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.field}>
        <label htmlFor="training-full-name">{localize(trainingCopy.fullName, locale)} *</label>
        <input id="training-full-name" name="fullName" autoComplete="name" minLength={2} required />
      </div>
      <div className={styles.field}>
        <label htmlFor="training-email">{localize(trainingCopy.email, locale)} *</label>
        <input id="training-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="training-phone">{localize(trainingCopy.phone, locale)} *</label>
        <input
          id="training-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          minLength={6}
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="training-program">{localize(trainingCopy.program, locale)} *</label>
        <select id="training-program" name="program" defaultValue={program.slug} required>
          <option value={program.slug}>{localize(program.title, locale)}</option>
        </select>
      </div>
      {program.scholarshipQuestions.length > 0 ? (
        <div className={styles.field}>
          <label htmlFor="training-scholarship">
            {localize(trainingCopy.scholarshipCode, locale)}
          </label>
          <input
            id="training-scholarship"
            name="scholarshipCode"
            autoCapitalize="characters"
            value={scholarshipCode}
            onChange={(event) => setScholarshipCode(event.target.value)}
          />
        </div>
      ) : null}
      <div className={[styles.field, styles.messageField].join(" ")}>
        <label htmlFor="training-message">{localize(trainingCopy.message, locale)}</label>
        <textarea id="training-message" name="message" rows={4} />
      </div>
      <button type="submit">{localize(trainingCopy.submit, locale)}</button>
      {showDevelopmentNotice ? (
        <p className={styles.developmentNotice} role="status" tabIndex={-1}>
          {localize(trainingCopy.developmentNotice, locale)}
        </p>
      ) : null}
    </form>
  );
}
