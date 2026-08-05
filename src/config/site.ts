import type { Locale } from "@/i18n/routing";

export const siteConfig = {
  name: "SynergyMazeAI",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://synergymazeai.com",
  email: "info@synergymazeai.com",
  locales: ["en", "tr", "ar"] as Locale[]
};
