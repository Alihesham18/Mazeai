"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldAlert, UserCheck, UserX } from "lucide-react";

import { changeAdminUserStatusAction } from "@/app/[locale]/admin/users/[userId]/actions";
import type { Locale } from "@/i18n/routing";
import type { AdminUserMutableStatus, AdminUserStatus } from "@/lib/directus/admin-users";

import { AdminConfirmationDialog } from "./AdminConfirmationDialog";
import styles from "./AdminUsers.module.css";

interface AdminUserStatusActionProps {
  locale: Locale;
  userId: string;
  currentStatus: AdminUserStatus | null;
}

export function AdminUserStatusAction({
  locale,
  userId,
  currentStatus
}: AdminUserStatusActionProps) {
  const router = useRouter();
  const t = useTranslations("adminAuth");
  const cardTitleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [isPending, setIsPending] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const isSupportedStatus = currentStatus === "active" || currentStatus === "suspended";

  const newStatus: AdminUserMutableStatus = currentStatus === "active" ? "suspended" : "active";

  const isSuspending = newStatus === "suspended";

  if (!isSupportedStatus) {
    return null;
  }

  function openConfirmation() {
    setMessage(null);
    setIsError(false);
    setIsConfirmOpen(true);
  }

  function closeConfirmation() {
    if (isPending) return;
    setIsConfirmOpen(false);
  }

  async function handleStatusChange() {
    setMessage(null);
    setIsError(false);
    setIsPending(true);

    try {
      const result = await changeAdminUserStatusAction({
        locale,
        userId,
        status: newStatus
      });

      switch (result.state) {
        case "updated":
          setIsError(false);
          setIsConfirmOpen(false);
          setMessage(
            result.status === "active"
              ? t("users.statusAction.successActivated")
              : t("users.statusAction.successSuspended")
          );
          router.refresh();
          return;

        case "selfTarget":
          setIsError(true);
          setIsConfirmOpen(false);
          setMessage(t("users.statusAction.errors.selfTarget"));
          return;

        case "invalidTransition":
          setIsError(true);
          setIsConfirmOpen(false);
          setMessage(t("users.statusAction.errors.invalidTransition"));
          return;

        case "notFound":
          setIsError(true);
          setIsConfirmOpen(false);
          setMessage(t("users.statusAction.errors.notFound"));
          return;

        case "invalidUserId":
          setIsError(true);
          setIsConfirmOpen(false);
          setMessage(t("users.statusAction.errors.invalidUserId"));
          return;

        case "invalidStatus":
          setIsError(true);
          setIsConfirmOpen(false);
          setMessage(t("users.statusAction.errors.invalidStatus"));
          return;

        case "unavailable":
        default:
          setIsError(true);
          setIsConfirmOpen(false);
          setMessage(t("users.statusAction.errors.unavailable"));
      }
    } catch {
      setIsError(true);
      setIsConfirmOpen(false);
      setMessage(t("users.statusAction.errors.unavailable"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <section className={styles.statusActionCard} aria-labelledby={cardTitleId}>
        <div className={styles.statusActionContent}>
          <div
            className={`${styles.statusActionIcon} ${
              currentStatus === "active"
                ? styles.statusActionIconActive
                : styles.statusActionIconSuspended
            }`}
            aria-hidden="true"
          >
            {currentStatus === "active" ? <UserCheck size={22} /> : <UserX size={22} />}
          </div>

          <div className={styles.statusActionText}>
            <p className={styles.statusActionEyebrow}>{t("users.statusAction.accountControl")}</p>

            <h2 id={cardTitleId}>{t("users.statusAction.accountStatus")}</h2>

            <p>
              {currentStatus === "active"
                ? t("users.statusAction.activeDescription")
                : t("users.statusAction.suspendedDescription")}
            </p>
          </div>
        </div>

        <div className={styles.statusActionControls}>
          <span
            className={`${styles.statusActionBadge} ${
              currentStatus === "active"
                ? styles.statusActionBadgeActive
                : styles.statusActionBadgeSuspended
            }`}
          >
            <span aria-hidden="true" />
            {currentStatus === "active"
              ? t("users.statusAction.active")
              : t("users.statusAction.suspended")}
          </span>

          <button
            ref={triggerRef}
            type="button"
            className={isSuspending ? styles.suspendUserButton : styles.activateUserButton}
            onClick={openConfirmation}
            disabled={isPending}
          >
            {isSuspending ? (
              <UserX size={17} aria-hidden="true" />
            ) : (
              <UserCheck size={17} aria-hidden="true" />
            )}

            {isSuspending
              ? t("users.statusAction.suspendUser")
              : t("users.statusAction.activateUser")}
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
        isOpen={isConfirmOpen}
        isPending={isPending}
        eyebrow={
          isSuspending
            ? t("users.statusAction.accountSuspension")
            : t("users.statusAction.accountActivation")
        }
        title={
          isSuspending
            ? t("users.statusAction.suspendTitle")
            : t("users.statusAction.activateTitle")
        }
        description={
          isSuspending
            ? t("users.statusAction.suspendConfirmation")
            : t("users.statusAction.activateConfirmation")
        }
        cancelLabel={t("users.statusAction.cancel")}
        confirmLabel={
          isSuspending ? t("users.statusAction.suspendUser") : t("users.statusAction.activateUser")
        }
        pendingLabel={t("users.statusAction.updating")}
        closeLabel={t("users.statusAction.closeConfirmation")}
        tone={isSuspending ? "danger" : "success"}
        icon={isSuspending ? <ShieldAlert size={25} /> : <UserCheck size={25} />}
        returnFocusRef={triggerRef}
        onClose={closeConfirmation}
        onConfirm={handleStatusChange}
      />
    </>
  );
}
