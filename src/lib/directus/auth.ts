import {
  isDirectusError,
  login,
  logout,
  passwordRequest,
  passwordReset,
  readMe,
  refresh,
  registerUser,
  updateMe,
  withToken
} from "@directus/sdk";
import { cookies } from "next/headers";
import { createDirectusRestClient } from "./client";
import type { DirectusSession, DirectusWebsiteUser } from "./types";

export const directusAccessTokenCookie = "synergymazeai-directus-access-token";
export const directusRefreshTokenCookie = "synergymazeai-directus-refresh-token";
export const directusExpiresAtCookie = "synergymazeai-directus-expires-at";
export const authPersistenceCookie = "synergymazeai-auth-persistent";

export type DirectusAuthErrorCode =
  | "accountExists"
  | "backendUnavailable"
  | "configuration"
  | "invalidCredentials"
  | "passwordWeak"
  | "serverFailure"
  | "sessionExpired";

const defaultRefreshMaxAge = 60 * 60 * 24 * 30;

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(maxAge ? { maxAge } : {})
  };
}

function sessionMaxAge(session: DirectusSession) {
  return Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000));
}

function toSession(data: {
  access_token: string | null;
  refresh_token: string | null;
  expires: number | null;
  expires_at: number | null;
}): DirectusSession | null {
  if (!data.access_token || !data.refresh_token) {
    return null;
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at ?? Date.now() + (data.expires ?? 0)
  };
}

export function getRememberPreference() {
  return cookies().get(authPersistenceCookie)?.value !== "false";
}

export function setRememberPreference(remember: boolean) {
  cookies().set(authPersistenceCookie, remember ? "true" : "false", {
    ...cookieOptions(remember ? 60 * 60 * 24 * 365 : undefined)
  });
}

export function clearDirectusSession() {
  cookies().delete(directusAccessTokenCookie);
  cookies().delete(directusRefreshTokenCookie);
  cookies().delete(directusExpiresAtCookie);
  cookies().delete(authPersistenceCookie);
}

export function setDirectusSession(session: DirectusSession, remember = getRememberPreference()) {
  cookies().set(directusAccessTokenCookie, session.accessToken, cookieOptions(sessionMaxAge(session)));
  cookies().set(
    directusRefreshTokenCookie,
    session.refreshToken,
    cookieOptions(remember ? defaultRefreshMaxAge : undefined)
  );
  cookies().set(
    directusExpiresAtCookie,
    String(session.expiresAt),
    cookieOptions(remember ? defaultRefreshMaxAge : undefined)
  );
}

export function readDirectusSession(): DirectusSession | null {
  const accessToken = cookies().get(directusAccessTokenCookie)?.value;
  const refreshToken = cookies().get(directusRefreshTokenCookie)?.value;
  const expiresAt = Number(cookies().get(directusExpiresAtCookie)?.value);

  if (!accessToken || !refreshToken || !Number.isFinite(expiresAt)) {
    return null;
  }

  return { accessToken, refreshToken, expiresAt };
}

export function directusAuthErrorCode(error: unknown): DirectusAuthErrorCode {
  if (error instanceof TypeError) {
    return "backendUnavailable";
  }

  const messages = isDirectusError(error)
    ? error.errors.map((entry) => entry.message).join(" ")
    : error instanceof Error
      ? error.message
      : "";
  const normalized = messages.toLowerCase();

  if (normalized.includes("invalid") && normalized.includes("credential")) {
    return "invalidCredentials";
  }

  if (normalized.includes("invalid") && (normalized.includes("email") || normalized.includes("password"))) {
    return "invalidCredentials";
  }

  if (normalized.includes("already") || normalized.includes("unique") || normalized.includes("duplicate")) {
    return "accountExists";
  }

  if (normalized.includes("password") && (normalized.includes("weak") || normalized.includes("short"))) {
    return "passwordWeak";
  }

  if (normalized.includes("inactive") || normalized.includes("suspended")) {
    return "sessionExpired";
  }

  return "serverFailure";
}

export async function registerDirectusUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const client = createDirectusRestClient();
  if (!client) return { ok: false as const, error: "configuration" as const };

  try {
    await client.request(
      registerUser(input.email, input.password, {
        first_name: input.firstName,
        last_name: input.lastName
      })
    );
    return { ok: true as const };
  } catch (caught) {
    return { ok: false as const, error: directusAuthErrorCode(caught) };
  }
}

export async function loginDirectusUser(input: {
  email: string;
  password: string;
  remember: boolean;
}) {
  const client = createDirectusRestClient();
  if (!client) return { ok: false as const, error: "configuration" as const };

  try {
    const authData = await client.request(
      login({ email: input.email, password: input.password }, { mode: "json" })
    );
    const session = toSession(authData);

    if (!session) {
      return { ok: false as const, error: "serverFailure" as const };
    }

    setRememberPreference(input.remember);
    setDirectusSession(session, input.remember);
    return { ok: true as const };
  } catch (caught) {
    return { ok: false as const, error: directusAuthErrorCode(caught) };
  }
}

export async function refreshDirectusSession(session = readDirectusSession()) {
  const client = createDirectusRestClient();
  if (!client || !session?.refreshToken) return null;

  try {
    const authData = await client.request(
      refresh({ refresh_token: session.refreshToken, mode: "json" })
    );
    const nextSession = toSession(authData);

    if (!nextSession) {
      clearDirectusSession();
      return null;
    }

    setDirectusSession(nextSession);
    return nextSession;
  } catch {
    clearDirectusSession();
    return null;
  }
}

export async function logoutDirectusUser() {
  const client = createDirectusRestClient();
  const refreshToken = cookies().get(directusRefreshTokenCookie)?.value;

  if (client && refreshToken) {
    try {
      await client.request(logout({ refresh_token: refreshToken, mode: "json" }));
    } catch {
      // Local cookies are cleared even if Directus is already unreachable.
    }
  }

  clearDirectusSession();
}

export async function getCurrentDirectusUser() {
  const client = createDirectusRestClient();
  if (!client) return null;

  let session = readDirectusSession();
  if (!session) return null;

  if (session.expiresAt <= Date.now() + 10_000) {
    session = await refreshDirectusSession(session);
    if (!session) return null;
  }

  try {
    return await client.request(
      withToken(
        session.accessToken,
        readMe({
          fields: ["id", "first_name", "last_name", "email", "role", "status", "telephone", "phone"]
        })
      )
    ) as DirectusWebsiteUser;
  } catch {
    return null;
  }
}

export async function updateCurrentDirectusUser(input: {
  firstName: string;
  lastName: string;
  telephone: string;
}) {
  const client = createDirectusRestClient();
  const session = readDirectusSession();
  if (!client || !session) return { ok: false as const, error: "sessionExpired" as const };

  try {
    await client.request(
      withToken(
        session.accessToken,
        updateMe({
          first_name: input.firstName,
          last_name: input.lastName,
          telephone: input.telephone
        })
      )
    );
    return { ok: true as const };
  } catch (caught) {
    try {
      await client.request(
        withToken(
          session.accessToken,
          updateMe({
            first_name: input.firstName,
            last_name: input.lastName
          })
        )
      );
      return { ok: true as const, phonePersisted: false as const };
    } catch {
      return { ok: false as const, error: directusAuthErrorCode(caught) };
    }
  }
}

export async function requestDirectusPasswordReset(email: string, resetUrl: string) {
  const client = createDirectusRestClient();
  if (!client) return { ok: false as const, error: "configuration" as const };

  try {
    await client.request(passwordRequest(email, resetUrl));
    return { ok: true as const };
  } catch (caught) {
    return { ok: false as const, error: directusAuthErrorCode(caught) };
  }
}

export async function resetDirectusPassword(token: string, password: string) {
  const client = createDirectusRestClient();
  if (!client) return { ok: false as const, error: "configuration" as const };

  try {
    await client.request(passwordReset(token, password));
    return { ok: true as const };
  } catch (caught) {
    return { ok: false as const, error: directusAuthErrorCode(caught) };
  }
}
