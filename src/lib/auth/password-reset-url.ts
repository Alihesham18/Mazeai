import "server-only";

import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/routing";

export function createTrustedPasswordResetUrl(
  locale: Locale,
  configuredSiteUrl = siteConfig.url
): string | null {
  try {
    const configured = new URL(configuredSiteUrl);
    if (
      !["http:", "https:"].includes(configured.protocol) ||
      configured.username ||
      configured.password
    ) {
      return null;
    }

    const callback = new URL(`/${locale}/auth/callback`, configured.origin);
    callback.searchParams.set("next", `/${locale}/update-password`);
    return callback.toString();
  } catch {
    return null;
  }
}
