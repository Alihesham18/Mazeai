import { getCurrentDirectusUser } from "@/lib/directus/auth";
import type { DirectusPhoneProfile, DirectusWebsiteUser } from "@/lib/directus/types";
import { combineStoredPhone } from "@/lib/phone/normalize";
import type { AuthProfile } from "./types";

function directusString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function toAuthProfile(user: DirectusWebsiteUser): AuthProfile {
  const firstName = directusString(user.first_name);
  const lastName = directusString(user.last_name);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return {
    id: user.id,
    email: directusString(user.email),
    firstName,
    lastName,
    fullName,
    telephone: "",
    status: directusString(user.status)
  };
}

export function withDirectusProfilePhone(
  profile: AuthProfile,
  directusProfile: DirectusPhoneProfile | null
): AuthProfile {
  return {
    ...profile,
    telephone: directusProfile
      ? combineStoredPhone(directusProfile.phone_country_code, directusProfile.phone_number)
      : ""
  };
}

export async function getCurrentUserProfile() {
  const user = await getCurrentDirectusUser();
  if (!user) return null;

  return toAuthProfile(user);
}
