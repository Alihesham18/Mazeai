import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthProfile } from "./types";

function metadataString(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export function toAuthProfile(user: User): AuthProfile {
  const firstName = metadataString(user, "first_name");
  const lastName = metadataString(user, "last_name");
  const storedFullName = metadataString(user, "full_name");
  const fullName = storedFullName || [firstName, lastName].filter(Boolean).join(" ");

  return {
    id: user.id,
    email: user.email ?? "",
    firstName,
    lastName,
    fullName,
    telephone: metadataString(user, "telephone")
  };
}

export async function getCurrentUserProfile() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return toAuthProfile(user);
}
