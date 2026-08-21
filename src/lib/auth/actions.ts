"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isLocale, type Locale } from "@/i18n/routing";
import { createTrustedPasswordResetUrl } from "@/lib/auth/password-reset-url";
import {
  clearDirectusSession,
  changeCurrentDirectusPassword,
  getCurrentDirectusUser,
  loginDirectusUser,
  logoutDirectusUser,
  requestDirectusPasswordReset,
  resetDirectusPassword,
  setRememberPreference,
  updateCurrentDirectusUser
} from "@/lib/directus/auth";
import {
  ensureRegisteredUserAccountNumber,
  ensureUserAccountNumber
} from "@/lib/directus/account-numbers";
import { upsertCurrentUserDirectusProfile } from "@/lib/directus/profile";
import { splitPhoneForStorage } from "@/lib/phone/normalize";
import { registerDirectusUser } from "@/lib/directus/auth";
import type { AuthActionState } from "./types";
import {
  changePasswordSchema,
  loginSchema,
  profileSchema,
  registrationSchema,
  resetRequestSchema,
  updatePasswordSchema
} from "./validation";

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}

function error(message: AuthActionState["message"]): AuthActionState {
  return { status: "error", message };
}

function success(message: AuthActionState["message"]): AuthActionState {
  return { status: "success", message };
}

function safeLocale(locale: string): Locale {
  return isLocale(locale) ? locale : "en";
}

function safeDestination(destination: string, locale: Locale) {
  const localeRoot = `/${locale}`;
  return destination === localeRoot || destination.startsWith(`${localeRoot}/`)
    ? destination
    : `${localeRoot}/account`;
}

export async function loginAction(
  localeValue: string,
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const locale = safeLocale(localeValue);
  const parsed = loginSchema.safeParse({
    email: value(formData, "email"),
    password: value(formData, "password")
  });

  if (!parsed.success) {
    return error(
      parsed.error.issues.some((issue) => issue.path[0] === "email")
        ? "emailInvalid"
        : "requiredFields"
    );
  }

  const remember = value(formData, "remember") === "on";
  const result = await loginDirectusUser({ ...parsed.data, remember });

  if (!result.ok) {
    return error(result.error);
  }

  const currentUser = await getCurrentDirectusUser();
  if (currentUser) {
    // Provisioning is best-effort so account-number service downtime never blocks authentication.
    await ensureUserAccountNumber(currentUser.id);
  }

  revalidatePath(`/${locale}`, "layout");
  redirect(safeDestination(value(formData, "next"), locale));
}

export async function registerAction(
  localeValue: string,
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const locale = safeLocale(localeValue);
  const raw = {
    firstName: value(formData, "firstName"),
    lastName: value(formData, "lastName"),
    email: value(formData, "email"),
    telephone: value(formData, "telephone"),
    password: value(formData, "password"),
    confirmPassword: value(formData, "confirmPassword"),
    consent: value(formData, "consent")
  };
  const parsed = registrationSchema.safeParse(raw);

  if (!parsed.success) {
    if (raw.password !== raw.confirmPassword) return error("passwordMismatch");
    if (parsed.error.issues.some((issue) => issue.path[0] === "email"))
      return error("emailInvalid");
    if (parsed.error.issues.some((issue) => issue.path[0] === "password"))
      return error("passwordWeak");
    return error("requiredFields");
  }

  setRememberPreference(true);
  const { firstName, lastName, email, password } = parsed.data;
  const result = await registerDirectusUser({
    firstName,
    lastName,
    email,
    password
  });

  if (!result.ok) {
    return error(result.error);
  }

  // Registration never accepts an account number; a narrowly scoped server credential provisions it.
  await ensureRegisteredUserAccountNumber(email);

  redirect(`/${locale}/login?registered=1`);
}

export async function requestPasswordResetAction(
  localeValue: string,
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const locale = safeLocale(localeValue);
  const parsed = resetRequestSchema.safeParse({ email: value(formData, "email") });

  if (!parsed.success) {
    return error("emailInvalid");
  }

  const resetUrl = createTrustedPasswordResetUrl(locale);
  if (!resetUrl) return error("configuration");

  const result = await requestDirectusPasswordReset(parsed.data.email, resetUrl);

  if (!result.ok) {
    return error(result.error);
  }

  return success("resetRequested");
}

export async function updatePasswordAction(
  localeValue: string,
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const locale = safeLocale(localeValue);
  const token = value(formData, "token");
  const raw = {
    password: value(formData, "password"),
    confirmPassword: value(formData, "confirmPassword")
  };
  const parsed = updatePasswordSchema.safeParse(raw);

  if (!parsed.success) {
    return error(raw.password !== raw.confirmPassword ? "passwordMismatch" : "passwordWeak");
  }

  if (!token) return error("sessionExpired");

  const result = await resetDirectusPassword(token, parsed.data.password);

  if (!result.ok) return error(result.error);

  clearDirectusSession();
  revalidatePath(`/${locale}`, "layout");
  return success("passwordUpdated");
}

export async function changePasswordAction(
  localeValue: string,
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const locale = safeLocale(localeValue);
  const raw = {
    currentPassword: value(formData, "currentPassword"),
    newPassword: value(formData, "newPassword"),
    confirmPassword: value(formData, "confirmPassword")
  };
  const parsed = changePasswordSchema.safeParse(raw);

  if (!parsed.success) {
    if (raw.newPassword !== raw.confirmPassword) return error("passwordMismatch");
    if (raw.newPassword === raw.currentPassword && raw.newPassword) return error("newPasswordSame");
    if (raw.newPassword.length < 8) return error("passwordWeak");
    return error("requiredFields");
  }

  const result = await changeCurrentDirectusPassword(parsed.data);
  if (!result.ok) {
    return error(result.error === "invalidCredentials" ? "incorrectCurrentPassword" : result.error);
  }

  revalidatePath(`/${locale}`, "layout");
  return success("passwordUpdated");
}

export async function updateProfileAction(
  localeValue: string,
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const locale = safeLocale(localeValue);
  const parsed = profileSchema.safeParse({
    firstName: value(formData, "firstName"),
    lastName: value(formData, "lastName"),
    telephone: value(formData, "telephone")
  });

  if (!parsed.success) {
    return error(
      parsed.error.issues.some((issue) => issue.path[0] === "telephone")
        ? "invalidPhone"
        : "requiredFields"
    );
  }

  const { firstName, lastName, telephone } = parsed.data;
  const userResult = await updateCurrentDirectusUser({ firstName, lastName });

  if (!userResult.ok) return error(userResult.error);

  const profileResult = await upsertCurrentUserDirectusProfile(splitPhoneForStorage(telephone));
  if (!profileResult.ok) {
    return error(
      profileResult.error === "sessionExpired" ||
        profileResult.error === "backendUnavailable" ||
        profileResult.error === "configuration"
        ? profileResult.error
        : "profileUpdateFailed"
    );
  }

  revalidatePath(`/${locale}`, "layout");
  revalidatePath(`/${locale}/account`);
  return success("profileUpdated");
}

export async function logoutAction(localeValue: string, _formData: FormData) {
  const locale = safeLocale(localeValue);
  await logoutDirectusUser();
  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}`);
}
