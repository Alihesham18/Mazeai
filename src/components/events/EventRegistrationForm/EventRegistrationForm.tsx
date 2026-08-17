"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { PhoneInput } from "@/components/forms/PhoneInput";
import type { Locale } from "@/i18n/routing";
import type { AuthProfile } from "@/lib/auth/types";
import {
  submitEventRegistrationAction,
  type EventRegistrationActionState,
  type EventRegistrationMessage
} from "@/lib/events/actions";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./EventRegistrationForm.module.css";

const initialState: EventRegistrationActionState = { status: "idle" };

function SubmitButton({ label, submitted }: { label: string; submitted: boolean }) {
  const { pending } = useFormStatus();
  return <button disabled={pending || submitted}>{pending ? `${label}…` : label}</button>;
}

export function EventRegistrationForm({
  locale,
  slug,
  registrationOpen,
  user,
  labels
}: {
  locale: Locale;
  slug: string;
  registrationOpen: boolean;
  user: AuthProfile | null;
  labels: Record<EventRegistrationMessage | "register" | "phone" | "message", string>;
}) {
  const [state, formAction] = useFormState(
    submitEventRegistrationAction.bind(null, locale, slug),
    initialState
  );
  const returnPath = localizedPath(locale, `/events/${slug}#registration`);
  const loginPath = `${localizedPath(locale, "/login")}?next=${encodeURIComponent(returnPath)}`;

  if (!registrationOpen) {
    return <p className={styles.errorNotice}>{labels.registrationClosed}</p>;
  }
  if (!user) {
    return <Link className={styles.loginAction} href={loginPath}>{labels.register}</Link>;
  }

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="event-registration-phone">{labels.phone} *</label>
        <PhoneInput
          id="event-registration-phone"
          name="phone"
          defaultValue={user.telephone}
          locale={locale}
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="event-registration-message">{labels.message}</label>
        <textarea id="event-registration-message" name="message" rows={4} maxLength={2000} />
      </div>
      <SubmitButton label={labels.register} submitted={state.status === "success"} />
      {state.message ? (
        <p
          className={state.status === "success" ? styles.successNotice : styles.errorNotice}
          role={state.status === "success" ? "status" : "alert"}
        >
          {labels[state.message]}
        </p>
      ) : null}
    </form>
  );
}
