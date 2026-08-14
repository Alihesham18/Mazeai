import "server-only";

import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import { getCurrentUserProfile } from "./user";

export async function requireAccountUser(locale: Locale, destination = "/account") {
  const user = await getCurrentUserProfile();
  if (user) return user;

  const loginPath = localizedPath(locale, "/login");
  const returnPath = localizedPath(locale, destination);
  redirect(`${loginPath}?next=${encodeURIComponent(returnPath)}`);
}
