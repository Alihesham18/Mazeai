"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, KeyRound, Mail, ShieldAlert } from "lucide-react";

import { requestAdminUserPasswordResetAction } from "@/app/[locale]/admin/users/[userId]/actions";
import type { Locale } from "@/i18n/routing";

import { AdminConfirmationDialog } from "./AdminConfirmationDialog";
import styles from "./AdminUsers.module.css";

export function AdminUserPasswordResetAction({
  locale,
  userId,
  email
}: {
  locale: Locale;
  userId: string;
  email: string;
}) {
  const t = useTranslations("adminAuth");
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function closeDialog() {
    if (!isPending) setIsOpen(false);
  }

  async function handleResetRequest() {
    setMessage(null);
    setIsError(false);
    setIsPending(true);
    try {
      const result = await requestAdminUserPasswordResetAction({ locale, userId });
      switch (result.state) {
        case "sent":
          setIsOpen(false);
          setMessage(t("users.passwordReset.success"));
          return;
        case "invalidUserId":
          setIsError(true);
          setIsOpen(false);
          setMessage(t("users.passwordReset.errors.invalidUserId"));
          return;
        case "invalidLocale":
          setIsError(true);
          setIsOpen(false);
          setMessage(t("users.passwordReset.errors.invalidLocale"));
          return;
        case "notFound":
          setIsError(true);
          setIsOpen(false);
          setMessage(t("users.passwordReset.errors.notFound"));
          return;
        case "unavailable":
        default:
          setIsError(true);
          setIsOpen(false);
          setMessage(t("users.passwordReset.errors.unavailable"));
      }
    } catch {
      setIsError(true);
      setIsOpen(false);
      setMessage(t("users.passwordReset.errors.unavailable"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <section className={styles.statusActionCard} aria-labelledby={titleId}>
        <div className={styles.statusActionContent}>
          <div
            className={`${styles.statusActionIcon} ${styles.passwordActionIcon}`}
            aria-hidden="true"
          >
            <KeyRound size={22} />
          </div>
          <div className={styles.statusActionText}>
            <p className={styles.statusActionEyebrow}>{t("users.passwordReset.eyebrow")}</p>
            <h2 id={titleId}>{t("users.passwordReset.title")}</h2>
            <p>{t("users.passwordReset.description")}</p>
            <p className={styles.passwordResetRecipient}>
              {t("users.passwordReset.recipient")} <span dir="ltr">{email}</span>
            </p>
          </div>
        </div>
        <div className={styles.statusActionControls}>
          <button
            ref={triggerRef}
            type="button"
            className={styles.passwordResetButton}
            onClick={() => {
              setMessage(null);
              setIsError(false);
              setIsOpen(true);
            }}
            disabled={isPending}
          >
            <Mail size={17} aria-hidden="true" />
            {t("users.passwordReset.sendResetLink")}
          </button>
        </div>
      </section>

      {message ? (
        <div
          className={`${styles.statusFeedback} ${
            isError ? styles.statusFeedbackError : styles.statusFeedbackSuccess
          }`}
          role={isError ? "alert" : "status"}
          aria-live={isError ? "assertive" : "polite"}
        >
          {isError ? (
            <ShieldAlert size={18} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={18} aria-hidden="true" />
          )}
          <span>{message}</span>
        </div>
      ) : null}

      <AdminConfirmationDialog
        isOpen={isOpen}
        isPending={isPending}
        eyebrow={t("users.passwordReset.eyebrow")}
        title={t("users.passwordReset.confirmTitle")}
        description={t("users.passwordReset.confirmation", { email })}
        cancelLabel={t("users.passwordReset.cancel")}
        confirmLabel={t("users.passwordReset.sendResetLink")}
        pendingLabel={t("users.passwordReset.sending")}
        closeLabel={t("users.passwordReset.closeConfirmation")}
        tone="neutral"
        icon={<Mail size={25} />}
        returnFocusRef={triggerRef}
        onClose={closeDialog}
        onConfirm={handleResetRequest}
      />
    </>
  );
}
