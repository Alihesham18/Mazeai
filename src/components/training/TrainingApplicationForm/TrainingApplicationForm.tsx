"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { trainingCopy, type TrainingProgram } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize, localizedPath } from "@/lib/utilities/localize";
import type { AuthProfile } from "@/lib/auth/types";
import { PhoneInput } from "@/components/forms/PhoneInput";
import {
  submitTrainingApplicationAction,
  type TrainingApplicationActionState
} from "@/lib/training/actions";
import styles from "./TrainingApplicationForm.module.css";

const initialTrainingApplicationState: TrainingApplicationActionState = { status: "idle" };

function SubmitButton({ locale, submitted }: { locale: Locale; submitted: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || submitted}>
      {localize(pending ? trainingCopy.submitting : trainingCopy.submit, locale)}
    </button>
  );
}

function ApplicationMessage({ state, locale }: { state: TrainingApplicationActionState; locale: Locale }) {
  if (!state.message) return null;
  const copy = trainingCopy[state.message];
  return (
    <p
      className={state.status === "success" ? styles.successNotice : styles.errorNotice}
      role={state.status === "success" ? "status" : "alert"}
    >
      {localize(copy, locale)}
    </p>
  );
}

export function TrainingApplicationForm({
  locale,
  program,
  user
}: {
  locale: Locale;
  program: TrainingProgram;
  user: AuthProfile | null;
}) {
  const [state, formAction] = useFormState(
    submitTrainingApplicationAction.bind(null, locale, program.slug),
    initialTrainingApplicationState
  );
  const applicationPath = localizedPath(locale, `/training/${program.slug}#application`);
  const loginPath = `${localizedPath(locale, "/login")}?next=${encodeURIComponent(applicationPath)}`;

  if (!program.applicationOpen) {
    return (
      <p className={styles.errorNotice} role="status">
        {localize(
          program.directusAvailable ? trainingCopy.applicationClosed : trainingCopy.programUnavailable,
          locale
        )}
      </p>
    );
  }

  if (!user) {
    return (
      <Link className={styles.loginAction} href={loginPath}>
        {localize(trainingCopy.loginToApply, locale)}
      </Link>
    );
  }

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="training-first-name">{localize(trainingCopy.firstName, locale)} *</label>
        <input
          id="training-first-name"
          value={user.firstName}
          autoComplete="given-name"
          readOnly
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="training-last-name">{localize(trainingCopy.lastName, locale)} *</label>
        <input id="training-last-name" value={user.lastName} autoComplete="family-name" readOnly />
      </div>
      <div className={styles.field}>
        <label htmlFor="training-email">{localize(trainingCopy.email, locale)} *</label>
        <input
          id="training-email"
          name="email"
          type="email"
          autoComplete="email"
          value={user.email}
          readOnly
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="training-phone">{localize(trainingCopy.phone, locale)} *</label>
        <PhoneInput
          id="training-phone"
          name="phone"
          defaultValue={user.telephone}
          locale={locale}
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="training-program">{localize(trainingCopy.program, locale)} *</label>
        <select id="training-program" value={program.slug} disabled>
          <option value={program.slug}>{localize(program.title, locale)}</option>
        </select>
      </div>
      <div className={[styles.field, styles.messageField].join(" ")}>
        <label htmlFor="training-message">{localize(trainingCopy.message, locale)}</label>
        <textarea id="training-message" name="message" rows={4} />
      </div>
      <SubmitButton locale={locale} submitted={state.status === "success"} />
      <ApplicationMessage state={state} locale={locale} />
    </form>
  );
}
