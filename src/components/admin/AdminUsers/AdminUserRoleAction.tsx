"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldAlert, ShieldCheck, UserCog } from "lucide-react";

import { changeAdminUserRoleAction } from "@/app/[locale]/admin/users/[userId]/actions";
import type { Locale } from "@/i18n/routing";
import type { AdminUserRole } from "@/lib/directus/admin-users";

import { AdminConfirmationDialog } from "./AdminConfirmationDialog";
import styles from "./AdminUsers.module.css";

export function AdminUserRoleAction({
  locale,
  userId,
  currentRole
}: {
  locale: Locale;
  userId: string;
  currentRole: AdminUserRole;
}) {
  const t = useTranslations("adminAuth");
  const router = useRouter();
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const targetRole: AdminUserRole = currentRole === "websiteUser" ? "websiteAdmin" : "websiteUser";
  const isPromotion = targetRole === "websiteAdmin";

  function closeDialog() {
    if (!isPending) setIsOpen(false);
  }

  async function handleRoleChange() {
    setMessage(null);
    setIsError(false);
    setIsPending(true);
    try {
      const result = await changeAdminUserRoleAction({ locale, userId, role: targetRole });
      switch (result.state) {
        case "updated":
          setIsOpen(false);
          setMessage(
            result.role === "websiteAdmin"
              ? t("users.roleAction.successPromoted")
              : t("users.roleAction.successDemoted")
          );
          router.refresh();
          return;
        case "selfTarget":
          setIsError(true);
          setIsOpen(false);
          setMessage(t("users.roleAction.errors.selfTarget"));
          return;
        case "lastAdmin":
          setIsError(true);
          setIsOpen(false);
          setMessage(t("users.roleAction.errors.lastAdmin"));
          return;
        case "invalidTransition":
          setIsError(true);
          setIsOpen(false);
          setMessage(t("users.roleAction.errors.invalidTransition"));
          return;
        case "invalidUserId":
          setIsError(true);
          setIsOpen(false);
          setMessage(t("users.roleAction.errors.invalidUserId"));
          return;
        case "invalidRole":
          setIsError(true);
          setIsOpen(false);
          setMessage(t("users.roleAction.errors.invalidRole"));
          return;
        case "notFound":
          setIsError(true);
          setIsOpen(false);
          setMessage(t("users.roleAction.errors.notFound"));
          return;
        case "unavailable":
        default:
          setIsError(true);
          setIsOpen(false);
          setMessage(t("users.roleAction.errors.unavailable"));
      }
    } catch {
      setIsError(true);
      setIsOpen(false);
      setMessage(t("users.roleAction.errors.unavailable"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <section className={styles.statusActionCard} aria-labelledby={titleId}>
        <div className={styles.statusActionContent}>
          <div className={`${styles.statusActionIcon} ${styles.roleActionIcon}`} aria-hidden="true">
            {currentRole === "websiteAdmin" ? <ShieldCheck size={22} /> : <UserCog size={22} />}
          </div>
          <div className={styles.statusActionText}>
            <p className={styles.statusActionEyebrow}>{t("users.roleAction.eyebrow")}</p>
            <h2 id={titleId}>{t("users.roleAction.title")}</h2>
            <p>
              {currentRole === "websiteAdmin"
                ? t("users.roleAction.adminDescription")
                : t("users.roleAction.userDescription")}
            </p>
          </div>
        </div>
        <div className={styles.statusActionControls}>
          <span
            className={`${styles.statusActionBadge} ${
              currentRole === "websiteAdmin" ? styles.roleBadgeAdmin : styles.roleBadgeUser
            }`}
          >
            {currentRole === "websiteAdmin"
              ? t("users.roles.websiteAdmin")
              : t("users.roles.websiteUser")}
          </span>
          <button
            ref={triggerRef}
            type="button"
            className={styles.roleChangeButton}
            onClick={() => {
              setMessage(null);
              setIsError(false);
              setIsOpen(true);
            }}
            disabled={isPending}
          >
            <UserCog size={17} aria-hidden="true" />
            {t("users.roleAction.changeRole")}
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
        eyebrow={t("users.roleAction.eyebrow")}
        title={isPromotion ? t("users.roleAction.promoteTitle") : t("users.roleAction.demoteTitle")}
        description={
          isPromotion
            ? t("users.roleAction.promoteConfirmation")
            : t("users.roleAction.demoteConfirmation")
        }
        cancelLabel={t("users.roleAction.cancel")}
        confirmLabel={
          isPromotion ? t("users.roleAction.promoteUser") : t("users.roleAction.confirmDemotion")
        }
        pendingLabel={t("users.roleAction.updating")}
        closeLabel={t("users.roleAction.closeConfirmation")}
        tone={isPromotion ? "warning" : "danger"}
        icon={isPromotion ? <ShieldAlert size={25} /> : <UserCog size={25} />}
        returnFocusRef={triggerRef}
        onClose={closeDialog}
        onConfirm={handleRoleChange}
      />
    </>
  );
}
