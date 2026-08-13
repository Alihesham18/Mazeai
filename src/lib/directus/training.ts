import { createItem, isDirectusError, readItems, withToken } from "@directus/sdk";
import { unstable_noStore as noStore } from "next/cache";
import { createDirectusRestClient } from "./client";
import {
  directusAuthErrorCode,
  getAuthenticatedDirectusSession,
  type DirectusAuthErrorCode
} from "./auth";
import type {
  DirectusTrainingApplication,
  DirectusTrainingProgram,
  TrainingApplicationStatus
} from "./types";

type DirectusResult<T> = { ok: true; data: T } | { ok: false; error: DirectusAuthErrorCode };

function logTrainingReadError(operation: string, error: unknown) {
  if (process.env.NODE_ENV !== "development") return;
  if (isDirectusError(error)) {
    console.error(
      `[Directus training] ${operation} failed`,
      error.errors.map((entry) => ({
        code: entry.extensions?.code,
        reason: entry.extensions?.reason,
        message: entry.message
      }))
    );
    return;
  }
  console.error(
    `[Directus training] ${operation} failed`,
    error instanceof Error ? error.message : "Unknown Directus error"
  );
}

const programFields = [
  "id",
  "slug",
  "title",
  "category",
  "format",
  "duration_hours",
  "fee",
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

const accountApplicationFields = [
  "id",
  "status",
  "date_created",
  "date_updated",
  { training_program: ["id", "slug", "title"] }
] as const;

const applicationSubmissionLocks = new Map<string, Promise<void>>();

async function optionalAccessToken() {
  return (await getAuthenticatedDirectusSession())?.accessToken ?? null;
}

export async function getPublishedTrainingPrograms(): Promise<
  DirectusResult<DirectusTrainingProgram[]>
> {
  noStore();
  const client = createDirectusRestClient();
  if (!client) return { ok: false, error: "configuration" };

  try {
    const token = await optionalAccessToken();
    const programs = token
      ? await client.request(
          withToken(
            token,
            readItems("training_programs", {
              fields: programFields,
              filter: { status: { _eq: "published" } }
            })
          )
        )
      : await client.request(
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
    const token = await optionalAccessToken();
    const programs = token
      ? await client.request(
          withToken(
            token,
            readItems("training_programs", {
              fields: programFields,
              filter: { slug: { _eq: slug }, status: { _eq: "published" } },
              limit: 1
            })
          )
        )
      : await client.request(
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
