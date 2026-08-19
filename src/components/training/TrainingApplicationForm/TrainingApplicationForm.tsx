"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useFormState, useFormStatus } from "react-dom";
import type { Locale } from "@/i18n/routing";
import type { PublicTrainingProgram } from "@/lib/training/types";
import { localizedPath } from "@/lib/utilities/localize";
import type { AuthProfile } from "@/lib/auth/types";
import { PhoneInput } from "@/components/forms/PhoneInput";
import {
  submitTrainingApplicationAction,
  type TrainingApplicationActionState
} from "@/lib/training/actions";
import styles from "./TrainingApplicationForm.module.css";

const initialTrainingApplicationState: TrainingApplicationActionState = { status: "idle" };

function SubmitButton({ submitted }: { submitted: boolean }) {
  const t = useTranslations("training");
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || submitted}>
      {t(pending ? "submitting" : "submit")}
    </button>
  );
}

function ApplicationMessage({ state }: { state: TrainingApplicationActionState }) {
  const t = useTranslations("training");
  if (!state.message) return null;
  return (
    <p
      className={state.status === "success" ? styles.successNotice : styles.errorNotice}
      role={state.status === "success" ? "status" : "alert"}
    >
      {t(state.message)}
    </p>
  );
}

export function TrainingApplicationForm({
  locale,
  program,
  user
}: {
  locale: Locale;
  program: PublicTrainingProgram;
  user: AuthProfile | null;
}) {
  const t = useTranslations("training");
  const [state, formAction] = useFormState(
    submitTrainingApplicationAction.bind(null, locale, program.slug),
    initialTrainingApplicationState
  );
  const applicationPath = localizedPath(locale, `/training/${program.slug}#application`);
  const loginPath = `${localizedPath(locale, "/login")}?next=${encodeURIComponent(applicationPath)}`;

  if (!program.applicationOpen) {
    return (
      <p className={styles.errorNotice} role="status">
        {t("applicationClosed")}
      </p>
    );
  }

  if (!user) {
    return (
      <Link className={styles.loginAction} href={loginPath}>
        {t("loginToApply")}
      </Link>
    );
  }

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="training-first-name">{t("firstName")} *</label>
        <input
          id="training-first-name"
          value={user.firstName}
          autoComplete="given-name"
          readOnly
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="training-last-name">{t("lastName")} *</label>
        <input id="training-last-name" value={user.lastName} autoComplete="family-name" readOnly />
      </div>
      <div className={styles.field}>
        <label htmlFor="training-email">{t("email")} *</label>
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
        <label htmlFor="training-phone">{t("phone")} *</label>
        <PhoneInput
          id="training-phone"
          name="phone"
          defaultValue={user.telephone}
          locale={locale}
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="training-program">{t("program")} *</label>
        <select id="training-program" value={program.slug} disabled>
          <option value={program.slug}>{program.title}</option>
        </select>
      </div>
      <div className={[styles.field, styles.messageField].join(" ")}>
        <label htmlFor="training-message">{t("message")}</label>
        <textarea id="training-message" name="message" rows={4} />
      </div>
      <SubmitButton submitted={state.status === "success"} />
      <ApplicationMessage state={state} />
    </form>
  );
}
