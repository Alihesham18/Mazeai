import "server-only";

import { readItems } from "@directus/sdk";
import { unstable_noStore as noStore } from "next/cache";
import { locales, type Locale } from "@/i18n/routing";
import { createDirectusRestClient } from "./client";
import { richTextToPlainText } from "./case-studies";
import { logDirectusDiagnostic } from "./diagnostics";
import type { DirectusBlogPost, DirectusBlogPostTranslation } from "./types";

export type BlogReadResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: "configuration" | "requestFailed" };

export interface BlogPost {
  id: string;
  slug: string;
  sort: number | null;
  publishedAt: string | null;
  locale: Locale;
  title: string;
  excerpt: string | null;
  content: string | null;
  seoTitle: string;
  seoDescription: string | null;
}

const translationFields = [
  "id",
  "language",
  "title",
  "excerpt",
  "content",
  "seo_title",
  "seo_description"
] as const;

const blogPostFields = [
  "id",
  "slug",
  "status",
  "sort",
  "published_at",
  { translations: translationFields }
] as const;

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizePublishedAt(value: unknown) {
  const publishedAt = cleanText(value);
  return publishedAt && Number.isFinite(Date.parse(publishedAt)) ? publishedAt : null;
}

function isSupportedLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function resolveBlogTranslation(
  translations: readonly DirectusBlogPostTranslation[],
  locale: Locale
) {
  const usable = translations.filter(
    (translation) =>
      isSupportedLocale(translation.language) && Boolean(cleanText(translation.title))
  );

  return (
    usable.find((translation) => translation.language === locale) ??
    usable.find((translation) => translation.language === "en") ??
    locales
      .map((supportedLocale) =>
        usable.find((translation) => translation.language === supportedLocale)
      )
      .find((translation) => translation !== undefined) ??
    null
  );
}

function normalizeBlogPost(raw: DirectusBlogPost, locale: Locale): BlogPost | null {
  const slug = cleanText(raw.slug);
  const translation = resolveBlogTranslation(raw.translations ?? [], locale);
  const title = cleanText(translation?.title);
  if (!slug || !translation || !title) return null;

  const excerpt = richTextToPlainText(translation.excerpt);
  return {
    id: String(raw.id),
    slug,
    sort: raw.sort !== null && Number.isFinite(Number(raw.sort)) ? Number(raw.sort) : null,
    publishedAt: normalizePublishedAt(raw.published_at),
    locale: translation.language as Locale,
    title,
    excerpt,
    content: richTextToPlainText(translation.content),
    seoTitle: cleanText(translation.seo_title) ?? title,
    seoDescription: richTextToPlainText(translation.seo_description) ?? excerpt
  };
}

function sortBlogPosts(records: DirectusBlogPost[]) {
  return [...records].sort((first, second) => {
    const firstSort =
      first.sort !== null && Number.isFinite(Number(first.sort))
        ? Number(first.sort)
        : Number.MAX_SAFE_INTEGER;
    const secondSort =
      second.sort !== null && Number.isFinite(Number(second.sort))
        ? Number(second.sort)
        : Number.MAX_SAFE_INTEGER;
    if (firstSort !== secondSort) return firstSort - secondSort;
    const slugDifference = String(first.slug).localeCompare(String(second.slug));
    return slugDifference || String(first.id).localeCompare(String(second.id));
  });
}

export async function getPublishedBlogPosts(
  locale: Locale
): Promise<BlogReadResult<BlogPost[]>> {
  noStore();
  const client = createDirectusRestClient();
  if (!client) return { ok: false, error: "configuration" };

  try {
    const records = await client.request(
      readItems("blog_posts", {
        fields: blogPostFields,
        filter: { status: { _eq: "published" } },
        sort: ["sort", "slug", "id"]
      })
    );
    return {
      ok: true,
      data: sortBlogPosts(records).flatMap((record) => {
        const normalized = normalizeBlogPost(record, locale);
        return normalized ? [normalized] : [];
      })
    };
  } catch (caught) {
    logDirectusDiagnostic("blog.read-published", caught);
    return { ok: false, error: "requestFailed" };
  }
}

export async function getPublishedBlogPostBySlug(
  slug: string,
  locale: Locale
): Promise<BlogReadResult<BlogPost | null>> {
  noStore();
  const client = createDirectusRestClient();
  if (!client) return { ok: false, error: "configuration" };

  try {
    const records = await client.request(
      readItems("blog_posts", {
        fields: blogPostFields,
        filter: {
          slug: { _eq: slug },
          status: { _eq: "published" }
        },
        limit: 1
      })
    );
    return { ok: true, data: records[0] ? normalizeBlogPost(records[0], locale) : null };
  } catch (caught) {
    logDirectusDiagnostic("blog.read-published-by-slug", caught);
    return { ok: false, error: "requestFailed" };
  }
}
