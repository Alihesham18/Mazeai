import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { locales } from "@/i18n/routing";

const paths = [
  "",
  "services",
  "services/web-development",
  "services/web-design",
  "research",
  "events",
  "case-studies",
  "blog",
  "about",
  "contact",
  "privacy",
  "cookies",
  "terms",
  "personal-data-notice"
];

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${siteConfig.url}/${locale}${path ? `/${path}` : ""}`,
      lastModified: new Date("2026-08-05"),
      changeFrequency: "weekly" as const,
      priority: path ? 0.7 : 1
    }))
  );
}
