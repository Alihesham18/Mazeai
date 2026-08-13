import { getCurrentDirectusUser } from "@/lib/directus/auth";
import type { DirectusWebsiteUser } from "@/lib/directus/types";
import type { AuthProfile } from "./types";

function directusString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function directusRoleName(role: DirectusWebsiteUser["role"]) {
  if (!role) return undefined;
  return typeof role === "string" ? role : directusString(role.name) || role.id;
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
    telephone: directusString(user.telephone) || directusString(user.phone),
    role: directusRoleName(user.role),
    status: directusString(user.status) || undefined
  };
}

export async function getCurrentUserProfile() {
  const user = await getCurrentDirectusUser();
  if (!user) return null;

  return toAuthProfile(user);
}
