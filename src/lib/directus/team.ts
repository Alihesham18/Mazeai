import "server-only";

import { readItems } from "@directus/sdk";
import { unstable_noStore as noStore } from "next/cache";
import { locales, type Locale } from "@/i18n/routing";
import { richTextToPlainText } from "./case-studies";
import { createDirectusRestClient, getDirectusUrl } from "./client";
import { logDirectusDiagnostic } from "./diagnostics";
import type { DirectusTeamMember, DirectusTeamMemberTranslation } from "./types";

export type TeamReadResult<T> =
  { ok: true; data: T } | { ok: false; error: "configuration" | "requestFailed" };

export interface TeamMember {
  id: string;
  slug: string;
  fullName: string;
  photoUrl: string | null;
  photoAlt: string;
  linkedinUrl: string | null;
  category: string;
  locale: Locale;
  jobTitle: string;
  bio: string;
  expertise: string[];
}

const translationFields = ["id", "language", "job_title", "bio", "expertise", "photo_alt"] as const;

const teamMemberFields = [
  "id",
  "status",
  "sort",
  "slug",
  "full_name",
  "photo",
  "linkedin_url",
  "category",
  "expertise",
  { translations: translationFields }
] as const;

function cleanText(value: unknown, maximumLength = 5000) {
  if (typeof value !== "string") return null;
  const valueTrimmed = value.trim();
  return valueTrimmed && valueTrimmed.length <= maximumLength ? valueTrimmed : null;
}

function isSupportedLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function normalizeTeamExpertise(value: unknown) {
  let candidate = value;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(candidate)) return [];

  return [
    ...new Set(
      candidate.flatMap((item) => {
        const label = cleanText(item, 48);
        return label ? [label] : [];
      })
    )
  ].slice(0, 8);
}

export function normalizeLinkedInUrl(value: unknown) {
  const raw = cleanText(value, 500);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      (hostname !== "linkedin.com" && !hostname.endsWith(".linkedin.com")) ||
      !url.pathname.toLowerCase().startsWith("/in/") ||
      url.username ||
      url.password ||
      url.port
    ) {
      return null;
    }
    url.hash = "";
    url.search = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeTeamPhoto(value: unknown) {
  const fileId =
    typeof value === "string"
      ? cleanText(value, 128)
      : value && typeof value === "object" && "id" in value
        ? cleanText((value as { id?: unknown }).id, 128)
        : null;
  const directusUrl = getDirectusUrl();
  if (!fileId || !directusUrl || !/^[a-zA-Z0-9-]+$/.test(fileId)) return null;
  return `${directusUrl}/assets/${encodeURIComponent(fileId)}`;
}

export function resolveTeamTranslation(
  translations: readonly DirectusTeamMemberTranslation[],
  locale: Locale
) {
  const usable = translations.filter(
    (translation) =>
      isSupportedLocale(translation.language) &&
      Boolean(cleanText(translation.job_title, 160)) &&
      Boolean(richTextToPlainText(translation.bio))
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

export function normalizeTeamMember(raw: DirectusTeamMember, locale: Locale): TeamMember | null {
  const slug = cleanText(raw.slug, 120);
  const fullName = cleanText(raw.full_name, 160);
  const category = cleanText(raw.category, 80);
  const translation = resolveTeamTranslation(raw.translations ?? [], locale);
  const jobTitle = cleanText(translation?.job_title, 160);
  const bio = richTextToPlainText(translation?.bio);
  const localizedExpertise = normalizeTeamExpertise(translation?.expertise);

  if (
    !slug ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    !fullName ||
    !category ||
    !translation ||
    !jobTitle ||
    !bio
  ) {
    return null;
  }

  return {
    id: String(raw.id),
    slug,
    fullName,
    photoUrl: normalizeTeamPhoto(raw.photo),
    photoAlt: cleanText(translation.photo_alt, 240) ?? fullName,
    linkedinUrl: normalizeLinkedInUrl(raw.linkedin_url),
    category,
    locale: translation.language as Locale,
    jobTitle,
    bio,
    expertise:
      localizedExpertise.length > 0 ? localizedExpertise : normalizeTeamExpertise(raw.expertise)
  };
}

function sortTeamMembers(records: DirectusTeamMember[]) {
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

export async function getPublishedTeamMembers(
  locale: Locale
): Promise<TeamReadResult<TeamMember[]>> {
  noStore();
  const client = createDirectusRestClient();
  if (!client) return { ok: false, error: "configuration" };

  try {
    const records = await client.request(
      readItems("team_members", {
        fields: teamMemberFields,
        filter: { status: { _eq: "published" } },
        sort: ["sort", "slug", "id"]
      })
    );
    return {
      ok: true,
      data: sortTeamMembers(records.filter((record) => record.status === "published")).flatMap(
        (record) => {
          const normalized = normalizeTeamMember(record, locale);
          return normalized ? [normalized] : [];
        }
      )
    };
  } catch (caught) {
    logDirectusDiagnostic("team.read-published", caught);
    return { ok: false, error: "requestFailed" };
  }
}
