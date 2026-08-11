"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isLocale, type Locale } from "@/i18n/routing";
import { siteConfig } from "@/config/site";
import { authPersistenceCookie } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthActionState } from "./types";
import {
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

function requestOrigin() {
  return headers().get("origin") ?? siteConfig.url;
}

function setPersistencePreference(remember: boolean) {
  cookies().set(authPersistenceCookie, remember ? "true" : "false", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge: 60 * 60 * 24 * 365 } : {})
  });
}

function authErrorCode(message: string | undefined): AuthActionState["message"] {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("already") || normalized.includes("registered")) {
    return "accountExists";
  }

  if (normalized.includes("password") && (normalized.includes("weak") || normalized.includes("short"))) {
    return "passwordWeak";
  }

  return "serverFailure";
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
    return error(parsed.error.issues.some((issue) => issue.path[0] === "email") ? "emailInvalid" : "requiredFields");
  }

  const remember = value(formData, "remember") === "on";
  setPersistencePreference(remember);
  const supabase = createSupabaseServerClient({ remember });

  if (!supabase) {
    return error("configuration");
  }

  const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);

  if (signInError) {
    return error("invalidCredentials");
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
    if (parsed.error.issues.some((issue) => issue.path[0] === "email")) return error("emailInvalid");
    if (parsed.error.issues.some((issue) => issue.path[0] === "password")) return error("passwordWeak");
    return error("requiredFields");
  }

  setPersistencePreference(true);
  const supabase = createSupabaseServerClient({ remember: true });

  if (!supabase) {
    return error("configuration");
  }

  const { firstName, lastName, telephone, email, password } = parsed.data;
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${requestOrigin()}/${locale}/auth/callback?next=/${locale}/account`,
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        telephone
      }
    }
  });

  if (signUpError) {
    return error(authErrorCode(signUpError.message));
  }

  if (data.session) {
    revalidatePath(`/${locale}`, "layout");
    redirect(`/${locale}/account`);
  }

  return success("checkEmail");
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

  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return error("configuration");
  }

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${requestOrigin()}/${locale}/auth/callback?next=/${locale}/update-password`
  });

  if (resetError) {
    return error("serverFailure");
  }

  return success("resetRequested");
}

export async function updatePasswordAction(
  localeValue: string,
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const locale = safeLocale(localeValue);
  const raw = {
    password: value(formData, "password"),
    confirmPassword: value(formData, "confirmPassword")
  };
  const parsed = updatePasswordSchema.safeParse(raw);

  if (!parsed.success) {
    return error(raw.password !== raw.confirmPassword ? "passwordMismatch" : "passwordWeak");
  }

  const supabase = createSupabaseServerClient();

  if (!supabase) return error("configuration");

  const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (updateError) return error(authErrorCode(updateError.message));

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

  if (!parsed.success) return error("requiredFields");

  const supabase = createSupabaseServerClient();
  if (!supabase) return error("configuration");

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return error("sessionExpired");

  const { firstName, lastName, telephone } = parsed.data;
  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
      telephone
    }
  });

  if (updateError) return error("serverFailure");

  revalidatePath(`/${locale}`, "layout");
  revalidatePath(`/${locale}/account`);
  return success("profileUpdated");
}

export async function logoutAction(localeValue: string, _formData: FormData) {
  const locale = safeLocale(localeValue);
  const supabase = createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut({ scope: "local" });
  }

  cookies().delete(authPersistenceCookie);
  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}`);
}
