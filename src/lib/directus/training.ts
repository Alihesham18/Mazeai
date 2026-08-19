import { createItem, readItems, withToken } from "@directus/sdk";
import { unstable_noStore as noStore } from "next/cache";
import { createDirectusRestClient } from "./client";
import { getDirectusUrl } from "./client";
import { logDirectusDiagnostic } from "./diagnostics";
import {
  directusAuthErrorCode,
  getAuthenticatedDirectusSession,
  getCurrentDirectusUser,
  type DirectusAuthErrorCode
} from "./auth";
import type {
  DirectusTrainingApplication,
  DirectusTrainingProgram,
  DirectusTrainingProgramContentItemTranslation,
  DirectusTrainingProgramTranslation,
  TrainingApplicationStatus
} from "./types";
import type { Locale } from "@/i18n/routing";
import type {
  PublicTrainingContentItem,
  PublicTrainingProgram,
  TrainingCategory
} from "@/lib/training/types";
import { resolveTrainingTranslation } from "@/lib/training/translations";
import { toCurrencyNumber } from "@/lib/utilities/currency";

type DirectusResult<T> = { ok: true; data: T } | { ok: false; error: DirectusAuthErrorCode };

type PublicProgramTranslationRecord = Pick<
  DirectusTrainingProgramTranslation,
  | "id"
  | "language"
  | "title"
  | "short_description"
  | "description"
  | "image_alt"
  | "hours_breakdown"
  | "instructor_role"
>;

type PublicContentTranslationRecord = Pick<
  DirectusTrainingProgramContentItemTranslation,
  "id" | "language" | "title" | "description"
>;

interface PublicContentItemRecord {
  id: string;
  kind: string;
  sort: number | null;
  translations?: PublicContentTranslationRecord[] | null;
}

type PublicProgramRecord = Pick<
  DirectusTrainingProgram,
  | "id"
  | "slug"
  | "category"
  | "format"
  | "duration_hours"
  | "fee"
  | "currency"
  | "location"
  | "certificate_available"
  | "instructor_name"
  | "image_url"
  | "application_open"
  | "status"
> & {
  translations?: PublicProgramTranslationRecord[] | null;
  content_items?: PublicContentItemRecord[] | null;
};

function logTrainingReadError(operation: string, error: unknown) {
  logDirectusDiagnostic(`training-programs.${operation}`, error);
}

function logAccountTrainingReadError(error: unknown) {
  logDirectusDiagnostic("training-programs.read-accepted-for-current-user", error);
}

const programFields = [
  "id",
  "slug",
  "title",
  "category",
  "format",
  "duration_hours",
  "fee",
  "currency",
  "location",
  "certificate_available",
  "instructor_name",
  "instructor_role",
  "short_description",
  "about",
  "image_url",
  "application_open",
  "status"
] as const;

const publicProgramTranslationFields = [
  "id",
  "language",
  "title",
  "short_description",
  "description",
  "image_alt",
  "hours_breakdown",
  "instructor_role"
] as const;

const publicContentTranslationFields = [
  "id",
  "language",
  "title",
  "description"
] as const;

const publicProgramFields = [
  "id",
  "slug",
  "category",
  "format",
  "duration_hours",
  "fee",
  "currency",
  "location",
  "certificate_available",
  "instructor_name",
  "image_url",
  "application_open",
  "status",
  { translations: publicProgramTranslationFields },
  {
    content_items: [
      "id",
      "kind",
      "sort",
      { translations: publicContentTranslationFields }
    ]
  }
] as const;

const accountApplicationFields = [
  "id",
  "status",
  "date_created",
  "date_updated",
  { training_program: ["id", "slug", "title"] }
] as const;

const enrolledTrainingProgramFields = [
  "id",
  "slug",
  "title",
  "category",
  "format",
  "duration_hours",
  "fee",
  "currency",
  "location",
  "certificate_available",
  "instructor_name",
  "instructor_role",
  "short_description",
  "image_url",
  "application_open",
  "status"
] as const;

const acceptedApplicationFields = [
  "id",
  "status",
  "date_created",
  { training_program: enrolledTrainingProgramFields }
] as const;

const applicationSubmissionLocks = new Map<string, Promise<void>>();

function cleanText(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : null;
}

function publicImageUrl(value: string | null) {
  const image = cleanText(value);
  if (!image) return null;
  if (/^https?:\/\//.test(image)) return image;
  if (image.startsWith("/images/")) return image;
  const directusUrl = getDirectusUrl();
  return directusUrl
    ? `${directusUrl}${image.startsWith("/") ? "" : "/"}${image}`
    : null;
}

function normalizedContentItems(
  items: PublicContentItemRecord[] | null | undefined,
  kind: "curriculum" | "weekly_plan",
  locale: Locale
): PublicTrainingContentItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .flatMap((item) => {
      if (item.kind !== kind || typeof item.sort !== "number") return [];
      const translation = resolveTrainingTranslation(
        item.translations,
        locale,
        (candidate) => Boolean(cleanText(candidate.title))
      );
      const title = cleanText(translation?.title);
      if (!translation || !title) return [];

      return [{
        id: item.id,
        sort: item.sort,
        title,
        description: cleanText(translation.description)
      }];
    })
    .sort((left, right) => left.sort - right.sort);
}

export function normalizePublishedTrainingProgram(
  program: PublicProgramRecord,
  locale: Locale
): PublicTrainingProgram | null {
  if (program.status !== "published") return null;
  if (program.category !== "bootcamp" && program.category !== "short-course") return null;

  const translation = resolveTrainingTranslation<PublicProgramTranslationRecord>(
    program.translations,
    locale,
    (candidate) => Boolean(cleanText(candidate.title))
  );
  const title = cleanText(translation?.title);
  if (!translation || !title) return null;

  return {
    id: program.id,
    slug: program.slug,
    status: "published",
    category: program.category as TrainingCategory,
    title,
    shortDescription: cleanText(translation.short_description),
    description: cleanText(translation.description),
    image: publicImageUrl(program.image_url),
    imageAlt: cleanText(translation.image_alt),
    durationHours: program.duration_hours,
    location: cleanText(program.location),
    format: cleanText(program.format),
    instructor: cleanText(program.instructor_name),
    instructorRole: cleanText(translation.instructor_role),
    fee: program.fee === null ? null : toCurrencyNumber(program.fee),
    currency: cleanText(program.currency),
    certificate: program.certificate_available,
    hoursBreakdown: cleanText(translation.hours_breakdown),
    applicationOpen: program.application_open,
    curriculum: normalizedContentItems(program.content_items, "curriculum", locale),
    weeklyPlan: normalizedContentItems(program.content_items, "weekly_plan", locale)
  };
}

async function readLocalizedPublishedPrograms(slug?: string) {
  const client = createDirectusRestClient();
  if (!client) return { ok: false as const, error: "configuration" as const };

  const filter = slug
    ? { slug: { _eq: slug }, status: { _eq: "published" as const } }
    : { status: { _eq: "published" as const } };
  const query = {
    fields: publicProgramFields,
    filter,
    ...(slug ? { limit: 1 } : {})
  };

  try {
    const programs = await client.request(readItems("training_programs", query));
    return { ok: true as const, data: programs };
  } catch (caught) {
    logTrainingReadError(slug ? `localized published slug ${slug}` : "localized published list", caught);
    return { ok: false as const, error: directusAuthErrorCode(caught) };
  }
}

export async function getLocalizedPublishedTrainingPrograms(
  locale: Locale
): Promise<DirectusResult<PublicTrainingProgram[]>> {
  noStore();
  const result = await readLocalizedPublishedPrograms();
  if (!result.ok) return result;
  return {
    ok: true,
    data: result.data.flatMap((program) => {
      const normalized = normalizePublishedTrainingProgram(program, locale);
      return normalized ? [normalized] : [];
    })
  };
}

export async function getLocalizedPublishedTrainingProgramBySlug(
  slug: string,
  locale: Locale
): Promise<DirectusResult<PublicTrainingProgram | null>> {
  noStore();
  const result = await readLocalizedPublishedPrograms(slug);
  if (!result.ok) return result;
  const program = result.data[0];
  return {
    ok: true,
    data: program ? normalizePublishedTrainingProgram(program, locale) : null
  };
}

export async function getPublishedTrainingPrograms(): Promise<
  DirectusResult<DirectusTrainingProgram[]>
> {
  noStore();
  const client = createDirectusRestClient();
  if (!client) return { ok: false, error: "configuration" };

  try {
    const programs = await client.request(
      readItems("training_programs", {
        fields: programFields,
        filter: { status: { _eq: "published" } }
      })
    );
    return { ok: true, data: programs };
  } catch (caught) {
    logTrainingReadError("published program list", caught);
    return { ok: false, error: directusAuthErrorCode(caught) };
  }
}

export async function getPublishedTrainingProgramBySlug(
  slug: string
): Promise<DirectusResult<DirectusTrainingProgram | null>> {
  noStore();
  const client = createDirectusRestClient();
  if (!client) return { ok: false, error: "configuration" };

  try {
    const programs = await client.request(
      readItems("training_programs", {
        fields: programFields,
        filter: { slug: { _eq: slug }, status: { _eq: "published" } },
        limit: 1
      })
    );
    return { ok: true, data: programs[0] ?? null };
  } catch (caught) {
    logTrainingReadError(`published program slug ${slug}`, caught);
    return { ok: false, error: directusAuthErrorCode(caught) };
  }
}

export interface AccountTrainingApplication {
  id: string;
  status: TrainingApplicationStatus;
  dateCreated: string | null;
  program: { id: string; slug: string; title: string } | null;
}

function accountApplication(
  item: Pick<DirectusTrainingApplication, "id" | "status" | "date_created" | "date_updated"> & {
    training_program: string | Pick<DirectusTrainingProgram, "id" | "slug" | "title">;
  }
): AccountTrainingApplication {
  const program = typeof item.training_program === "string" ? null : item.training_program;
  return {
    id: item.id,
    status: item.status,
    dateCreated: item.date_created,
    program: program ? { id: program.id, slug: program.slug, title: program.title } : null
  };
}

export async function getCurrentUserTrainingApplications(): Promise<
  DirectusResult<AccountTrainingApplication[]>
> {
  noStore();
  const client = createDirectusRestClient();
  const session = await getAuthenticatedDirectusSession();
  if (!client || !session) return { ok: false, error: "sessionExpired" };

  try {
    const applications = await client.request(
      withToken(
        session.accessToken,
        readItems("training_applications", {
          fields: accountApplicationFields,
          sort: ["-date_created"]
        })
      )
    );
    return { ok: true, data: applications.map(accountApplication) };
  } catch (caught) {
    return { ok: false, error: directusAuthErrorCode(caught) };
  }
}

export type AccountEnrolledProgram = Pick<
  DirectusTrainingProgram,
  | "id"
  | "slug"
  | "title"
  | "category"
  | "format"
  | "duration_hours"
  | "fee"
  | "currency"
  | "location"
  | "certificate_available"
  | "instructor_name"
  | "instructor_role"
  | "short_description"
  | "image_url"
  | "application_open"
  | "status"
>;

export interface AccountEnrolledTraining {
  applicationId: string;
  status: "accepted";
  dateCreated: string | null;
  program: AccountEnrolledProgram;
}

export async function getCurrentUserAcceptedTrainingApplications(): Promise<
  DirectusResult<AccountEnrolledTraining[]>
> {
  noStore();
  const client = createDirectusRestClient();
  const currentUser = await getCurrentDirectusUser();
  const session = currentUser ? await getAuthenticatedDirectusSession() : null;
  if (!client || !session || !currentUser) return { ok: false, error: "sessionExpired" };

  try {
    const applications = await client.request(
      withToken(
        session.accessToken,
        readItems("training_applications", {
          fields: acceptedApplicationFields,
          filter: {
            user: { _eq: currentUser.id },
            status: { _eq: "accepted" }
          },
          sort: ["-date_created"]
        })
      )
    );

    return {
      ok: true,
      data: applications.flatMap((application) => {
        if (application.status !== "accepted" || typeof application.training_program === "string") {
          return [];
        }
        return [{
          applicationId: application.id,
          status: "accepted" as const,
          dateCreated: application.date_created,
          program: application.training_program
        }];
      })
    };
  } catch (caught) {
    logAccountTrainingReadError(caught);
    return { ok: false, error: directusAuthErrorCode(caught) };
  }
}

export async function createCurrentUserTrainingApplication(input: {
  programId: string;
  phoneCountryCode: string;
  phoneNumber: string;
  message: string | null;
}) {
  const client = createDirectusRestClient();
  const session = await getAuthenticatedDirectusSession();
  if (!client || !session) return { ok: false as const, error: "sessionExpired" as const };

  const lockKey = `${session.accessToken}:${input.programId}`;
  const previousSubmission = applicationSubmissionLocks.get(lockKey) ?? Promise.resolve();
  let releaseLock = () => {};
  const currentSubmission = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  applicationSubmissionLocks.set(lockKey, currentSubmission);
  await previousSubmission;

  try {
    const existing = await client.request(
      withToken(
        session.accessToken,
        readItems("training_applications", {
          fields: ["id", "status"],
          filter: { training_program: { _eq: input.programId } },
          limit: 1
        })
      )
    );
    if (existing[0]) {
      return { ok: false as const, error: "alreadyApplied" as const, status: existing[0].status };
    }

    await client.request(
      withToken(
        session.accessToken,
        createItem("training_applications", {
          training_program: input.programId,
          phone_country_code: input.phoneCountryCode,
          phone_number: input.phoneNumber,
          message: input.message
        })
      )
    );
    return { ok: true as const };
  } catch (caught) {
    return { ok: false as const, error: directusAuthErrorCode(caught) };
  } finally {
    releaseLock();
    if (applicationSubmissionLocks.get(lockKey) === currentSubmission) {
      applicationSubmissionLocks.delete(lockKey);
    }
  }
}
