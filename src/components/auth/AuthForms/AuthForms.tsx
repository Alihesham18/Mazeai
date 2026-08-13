"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useFormState, useFormStatus } from "react-dom";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  updatePasswordAction,
  updateProfileAction
} from "@/lib/auth/actions";
import {
  initialAuthActionState,
  type AuthActionState,
  type AuthMessageCode,
  type AuthProfile
} from "@/lib/auth/types";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { PhoneInput } from "@/components/forms/PhoneInput";
import styles from "./AuthForms.module.css";

function SubmitButton({
  idle,
  pending,
  disabled = false
}: {
  idle: string;
  pending: string;
  disabled?: boolean;
}) {
  const { pending: isPending } = useFormStatus();

  return (
    <button type="submit" className={styles.submit} disabled={disabled || isPending}>
      {isPending ? pending : idle}
    </button>
  );
}

function StateMessage({ state }: { state: AuthActionState }) {
  const t = useTranslations("auth.messages");

  if (!state.message) return null;

  return (
    <p
      className={state.status === "error" ? styles.error : styles.success}
      role={state.status === "error" ? "alert" : "status"}
    >
      {t(state.message)}
    </p>
  );
}

export function LoginForm({
  locale,
  next,
  initialMessage,
  initialStatus = "error"
}: {
  locale: Locale;
  next?: string;
  initialMessage?: AuthMessageCode;
  initialStatus?: AuthActionState["status"];
}) {
  const t = useTranslations("auth");
  const [state, formAction] = useFormState(loginAction.bind(null, locale), {
    ...initialAuthActionState,
    ...(initialMessage ? { status: initialStatus, message: initialMessage } : {})
  });

  return (
    <form className={styles.form} action={formAction}>
      <input type="hidden" name="next" value={next ?? localizedPath(locale, "/account")} />
      <label className={styles.field}>
        <span>{t("email")}</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <div className={styles.field}>
        <label htmlFor="login-password">{t("password")}</label>
        <PasswordInput
          id="login-password"
          name="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div className={styles.formOptions}>
        <label className={styles.checkbox}>
          <input name="remember" type="checkbox" defaultChecked />
          <span>{t("rememberMe")}</span>
        </label>
        <Link href={localizedPath(locale, "/forgot-password")}>{t("forgotPassword")}</Link>
      </div>
      <StateMessage state={state} />
      <SubmitButton idle={t("logIn")} pending={t("signingIn")} />
      <p className={styles.alternate}>
        {t("noAccount")} <Link href={localizedPath(locale, "/register")}>{t("createAccount")}</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ locale }: { locale: Locale }) {
  const t = useTranslations("auth");
  const [state, formAction] = useFormState(registerAction.bind(null, locale), initialAuthActionState);

  return (
    <form className={[styles.form, styles.twoColumns].join(" ")} action={formAction}>
      <label className={styles.field}>
        <span>{t("firstName")}</span>
        <input name="firstName" autoComplete="given-name" required />
      </label>
      <label className={styles.field}>
        <span>{t("lastName")}</span>
        <input name="lastName" autoComplete="family-name" required />
      </label>
      <label className={styles.field}>
        <span>{t("email")}</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className={styles.field}>
        <span>{t("telephone")}</span>
        <PhoneInput name="telephone" locale={locale} required />
      </label>
      <div className={styles.field}>
        <label htmlFor="register-password">{t("password")}</label>
        <PasswordInput
          id="register-password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="register-confirm-password">{t("confirmPassword")}</label>
        <PasswordInput
          id="register-confirm-password"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <label className={[styles.checkbox, styles.fullWidth].join(" ")}>
        <input name="consent" type="checkbox" required />
        <span>
          {t("consentPrefix")} <Link href={localizedPath(locale, "/terms")}>{t("terms")}</Link>{" "}
          {t("and")} <Link href={localizedPath(locale, "/privacy")}>{t("privacy")}</Link>.
        </span>
      </label>
      <div className={styles.fullWidth}>
        <StateMessage state={state} />
      </div>
      <div className={styles.fullWidth}>
        <SubmitButton idle={t("createAccount")} pending={t("creatingAccount")} />
      </div>
      <p className={[styles.alternate, styles.fullWidth].join(" ")}>
        {t("alreadyAccount")} <Link href={localizedPath(locale, "/login")}>{t("logIn")}</Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const t = useTranslations("auth");
  const [state, formAction] = useFormState(
    requestPasswordResetAction.bind(null, locale),
    initialAuthActionState
  );

  return (
    <form className={styles.form} action={formAction}>
      <label className={styles.field}>
        <span>{t("email")}</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <StateMessage state={state} />
      <SubmitButton idle={t("sendResetLink")} pending={t("sendingResetLink")} />
      <p className={styles.alternate}>
        <Link href={localizedPath(locale, "/login")}>{t("backToLogin")}</Link>
      </p>
    </form>
  );
}

export function UpdatePasswordForm({ locale, token }: { locale: Locale; token?: string }) {
  const t = useTranslations("auth");
  const [state, formAction] = useFormState(
    updatePasswordAction.bind(null, locale),
    initialAuthActionState
  );

  return (
    <form className={styles.form} action={formAction}>
      <input type="hidden" name="token" value={token ?? ""} />
      <label className={styles.field}>
        <span>{t("newPassword")}</span>
        <PasswordInput
          id="update-password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <label className={styles.field}>
        <span>{t("confirmPassword")}</span>
        <PasswordInput
          id="update-confirm-password"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <StateMessage state={state} />
      <SubmitButton idle={t("updatePassword")} pending={t("updatingPassword")} />
      {state.status === "success" ? (
        <p className={styles.alternate}>
          <Link href={localizedPath(locale, "/account")}>{t("myAccount")}</Link>
        </p>
      ) : null}
    </form>
  );
}

export function ProfileForm({
  locale,
  profile,
  initialMessage
}: {
  locale: Locale;
  profile: AuthProfile;
  initialMessage?: AuthMessageCode;
}) {
  const t = useTranslations("auth");
  const initialState: AuthActionState = initialMessage
    ? { status: "error", message: initialMessage }
    : initialAuthActionState;
  const [state, formAction] = useFormState(
    updateProfileAction.bind(null, locale),
    initialState
  );
  const profileUnavailable = initialMessage === "profileLoadFailed";

  return (
    <form className={[styles.form, styles.twoColumns].join(" ")} action={formAction}>
      <label className={styles.field}>
        <span>{t("firstName")}</span>
        <input name="firstName" defaultValue={profile.firstName} autoComplete="given-name" required />
      </label>
      <label className={styles.field}>
        <span>{t("lastName")}</span>
        <input name="lastName" defaultValue={profile.lastName} autoComplete="family-name" required />
      </label>
      <label className={styles.field}>
        <span>{t("email")}</span>
        <input value={profile.email} type="email" autoComplete="email" readOnly />
      </label>
      <label className={styles.field}>
        <span>{t("telephone")}</span>
        <PhoneInput
          name="telephone"
          locale={locale}
          defaultValue={profile.telephone}
          required
          disabled={profileUnavailable}
        />
      </label>
      <div className={styles.fullWidth}>
        <StateMessage state={state} />
      </div>
      <div className={styles.fullWidth}>
        <SubmitButton
          idle={t("saveChanges")}
          pending={t("savingChanges")}
          disabled={profileUnavailable}
        />
      </div>
    </form>
  );
}
