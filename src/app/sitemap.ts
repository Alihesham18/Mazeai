import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { locales } from "@/i18n/routing";
import { getPublishedBlogPosts } from "@/lib/directus/blog";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseEntries = locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${siteConfig.url}/${locale}${path ? `/${path}` : ""}`,
      lastModified: new Date("2026-08-05"),
      changeFrequency: "weekly" as const,
      priority: path ? 0.7 : 1
    }))
  );

  const blogResult = await getPublishedBlogPosts("en");
  if (!blogResult.ok) return baseEntries;

  const blogEntries = locales.flatMap((locale) =>
    blogResult.data.map((post) => ({
      url: `${siteConfig.url}/${locale}/blog/${post.slug}`,
      lastModified:
        post.publishedAt && Number.isFinite(Date.parse(post.publishedAt))
          ? new Date(post.publishedAt)
          : new Date("2026-08-05"),
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  );

  return [...baseEntries, ...blogEntries];
}
