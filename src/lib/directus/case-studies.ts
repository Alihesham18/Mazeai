import "server-only";

import { readItems } from "@directus/sdk";
import { unstable_noStore as noStore } from "next/cache";
import type { Locale } from "@/i18n/routing";
import { createDirectusRestClient, getDirectusUrl } from "./client";
import { logDirectusDiagnostic } from "./diagnostics";
import type {
  DirectusCaseStudy,
  DirectusCaseStudyTranslation
} from "./types";

type CaseStudyReadResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: "configuration" | "requestFailed" };

export interface CaseStudy {
  id: string;
  slug: string;
  featured: boolean;
  publishedAt: string | null;
  coverImage: string | null;
  industry: string | null;
  client: string | null;
  technologies: string[];
  locale: Locale;
  title: string;
  shortDescription: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  content: string | null;
}

const translationFields = [
  "id",
  "language",
  "title",
  "short_description",
  "challenge",
  "solution",
  "results",
  "content"
] as const;

const caseStudyFields = [
  "id",
  "slug",
  "status",
  "featured",
  "published_at",
  "cover_image",
  "industry",
  "client",
  "sort",
  "technologies",
  { translations: translationFields }
] as const;

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function decodeEntity(entity: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"'
  };
  if (entity in named) return named[entity];
  const numeric = entity.startsWith("#x")
    ? Number.parseInt(entity.slice(2), 16)
    : entity.startsWith("#")
      ? Number.parseInt(entity.slice(1), 10)
      : Number.NaN;
  return Number.isInteger(numeric) && numeric >= 0 && numeric <= 0x10ffff
    ? String.fromCodePoint(numeric)
    : `&${entity};`;
}

/** Converts CMS rich text to readable text that React will escape on render. */
export function richTextToPlainText(value: unknown) {
  const text = cleanText(value);
  if (!text) return null;
  return text
    .replace(/<(script|style|template|iframe|object|svg|math|form)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(?:p|div|h[1-6]|li|ul|ol|blockquote|pre|section|article)\b[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity: string) =>
      decodeEntity(entity.toLowerCase())
    )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim() || null;
}

export function normalizeCaseStudyTechnologies(value: unknown) {
  let candidate = value;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(candidate)) return [];
  return [...new Set(candidate.flatMap((item) => {
    const technology = cleanText(item);
    return technology ? [technology] : [];
  }))];
}

export function normalizeCaseStudyCoverImage(value: unknown) {
  const raw =
    typeof value === "string"
      ? cleanText(value)
      : value && typeof value === "object" && "id" in value
        ? cleanText((value as { id?: unknown }).id)
        : null;
  if (!raw) return null;
  const directusUrl = getDirectusUrl();
  if (!directusUrl) return null;
  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).origin === new URL(directusUrl).origin ? raw : null;
    } catch {
      return null;
    }
  }
  if (raw.startsWith("/")) return `${directusUrl}${raw}`;
  if (raw.startsWith("assets/")) return `${directusUrl}/${raw}`;
  return `${directusUrl}/assets/${encodeURIComponent(raw)}`;
}

function isLocale(value: string): value is Locale {
  return value === "en" || value === "tr" || value === "ar" || value === "fa";
}

export function resolveCaseStudyTranslation(
  translations: readonly DirectusCaseStudyTranslation[],
  locale: Locale
) {
  const usable = translations.filter(
    (translation) => isLocale(translation.language) && Boolean(cleanText(translation.title))
  );
  return (
    usable.find((translation) => translation.language === locale) ??
    usable.find((translation) => translation.language === "en") ??
    usable[0] ??
    null
  );
}

function normalizeCaseStudy(raw: DirectusCaseStudy, locale: Locale): CaseStudy | null {
  const slug = cleanText(raw.slug);
  const translation = resolveCaseStudyTranslation(raw.translations ?? [], locale);
  const title = cleanText(translation?.title);
  if (!slug || !translation || !title) return null;

  return {
    id: String(raw.id),
    slug,
    featured: raw.featured === true,
    publishedAt: cleanText(raw.published_at),
    coverImage: normalizeCaseStudyCoverImage(raw.cover_image),
    industry: cleanText(raw.industry),
    client: cleanText(raw.client),
    technologies: normalizeCaseStudyTechnologies(raw.technologies),
    locale: translation.language as Locale,
    title,
    shortDescription: richTextToPlainText(translation.short_description),
    challenge: richTextToPlainText(translation.challenge),
    solution: richTextToPlainText(translation.solution),
    results: richTextToPlainText(translation.results),
    content: richTextToPlainText(translation.content)
  };
}

function sortPublishedCaseStudies(records: DirectusCaseStudy[]) {
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
    const publishedDifference =
      (Date.parse(second.published_at ?? "") || 0) - (Date.parse(first.published_at ?? "") || 0);
    if (publishedDifference !== 0) return publishedDifference;
    const slugDifference = String(first.slug).localeCompare(String(second.slug));
    return slugDifference || String(first.id).localeCompare(String(second.id));
  });
}

export async function getPublishedCaseStudies(
  locale: Locale
): Promise<CaseStudyReadResult<CaseStudy[]>> {
  noStore();
  const client = createDirectusRestClient();
  if (!client) return { ok: false, error: "configuration" };

  try {
    const records = await client.request(
      readItems("case_studies", {
        fields: caseStudyFields,
        filter: { status: { _eq: "published" } },
        sort: ["sort", "-published_at", "slug", "id"]
      })
    );
    return {
      ok: true,
      data: sortPublishedCaseStudies(records).flatMap((record) => {
        const normalized = normalizeCaseStudy(record, locale);
        return normalized ? [normalized] : [];
      })
    };
  } catch (caught) {
    logDirectusDiagnostic("case-studies.read-published", caught);
    return { ok: false, error: "requestFailed" };
  }
}

export async function getPublishedCaseStudyBySlug(
  slug: string,
  locale: Locale
): Promise<CaseStudyReadResult<CaseStudy | null>> {
  noStore();
  const client = createDirectusRestClient();
  if (!client) return { ok: false, error: "configuration" };

  try {
    const records = await client.request(
      readItems("case_studies", {
        fields: caseStudyFields,
        filter: {
          slug: { _eq: slug },
          status: { _eq: "published" }
        },
        limit: 1
      })
    );
    return { ok: true, data: records[0] ? normalizeCaseStudy(records[0], locale) : null };
  } catch (caught) {
    logDirectusDiagnostic("case-studies.read-published-by-slug", caught);
    return { ok: false, error: "requestFailed" };
  }
}
