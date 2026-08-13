import { createItem, isDirectusError, readItems, updateItem, withToken } from "@directus/sdk";
import { createDirectusRestClient } from "./client";
import {
  directusAuthErrorCode,
  getAuthenticatedDirectusSession,
  type DirectusAuthErrorCode
} from "./auth";
import type { DirectusPhoneProfile } from "./types";

type ProfileResult =
  | { ok: true; profile: DirectusPhoneProfile | null }
  | { ok: false; error: DirectusAuthErrorCode };

const profileFields = ["id", "phone_country_code", "phone_number"] as const;

function isUniqueConflict(error: unknown) {
  if (!isDirectusError(error)) return false;

  return error.errors.some((entry) => {
    const code = String(entry.extensions?.code ?? "").toLowerCase();
    const message = entry.message.toLowerCase();
    return (
      code.includes("unique") ||
      code.includes("duplicate") ||
      message.includes("unique") ||
      message.includes("duplicate") ||
      message.includes("already exists")
    );
  });
}

export async function getCurrentUserDirectusProfile(): Promise<ProfileResult> {
  const client = createDirectusRestClient();
  if (!client) return { ok: false, error: "configuration" };

  const session = await getAuthenticatedDirectusSession();
  if (!session) return { ok: false, error: "sessionExpired" };

  try {
    const profiles = await client.request(
      withToken(
        session.accessToken,
        readItems("user_profiles", {
          fields: profileFields,
          limit: 1
        })
      )
    );

    return { ok: true, profile: profiles[0] ?? null };
  } catch (caught) {
    return { ok: false, error: directusAuthErrorCode(caught) };
  }
}

async function updateProfile(
  id: string,
  phone: { phone_country_code: string; phone_number: string }
) {
  const client = createDirectusRestClient();
  const session = await getAuthenticatedDirectusSession();
  if (!client || !session) return { ok: false as const, error: "sessionExpired" as const };

  try {
    await client.request(
      withToken(session.accessToken, updateItem("user_profiles", id, phone, { fields: profileFields }))
    );
    return { ok: true as const };
  } catch (caught) {
    return { ok: false as const, error: directusAuthErrorCode(caught) };
  }
}

export async function upsertCurrentUserDirectusProfile(phone: {
  phone_country_code: string;
  phone_number: string;
}) {
  const existing = await getCurrentUserDirectusProfile();
  if (!existing.ok) return existing;

  if (existing.profile) {
    return updateProfile(existing.profile.id, phone);
  }

  const client = createDirectusRestClient();
  const session = await getAuthenticatedDirectusSession();
  if (!client || !session) return { ok: false as const, error: "sessionExpired" as const };

  try {
    // Ownership is intentionally omitted; Directus presets user to $CURRENT_USER.
    await client.request(
      withToken(session.accessToken, createItem("user_profiles", phone, { fields: profileFields }))
    );
    return { ok: true as const };
  } catch (caught) {
    if (!isUniqueConflict(caught)) {
      return { ok: false as const, error: directusAuthErrorCode(caught) };
    }

    const racedProfile = await getCurrentUserDirectusProfile();
    if (!racedProfile.ok) return racedProfile;
    if (!racedProfile.profile) return { ok: false as const, error: "serverFailure" as const };

    return updateProfile(racedProfile.profile.id, phone);
  }
}
