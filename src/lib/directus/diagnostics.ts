import "server-only";

import { isDirectusError } from "@directus/sdk";

type ErrorWithResponse = {
  name?: string;
  message?: string;
  response?: { status?: number };
  status?: number;
};

export function logDirectusDiagnostic(stage: string, caught: unknown) {
  const directusError = isDirectusError(caught) ? caught.errors[0] : null;
  const error =
    typeof caught === "object" && caught !== null ? (caught as ErrorWithResponse) : null;
  const extensionStatus = directusError?.extensions?.status;
  const httpStatus =
    error?.response?.status ??
    error?.status ??
    (typeof extensionStatus === "number" ? extensionStatus : undefined);

  // Never include request objects, response bodies, tokens, cookies, or identifiers.
  console.error("[Directus server diagnostic]", {
    stage,
    errorName: error?.name ?? (caught instanceof Error ? caught.name : "UnknownError"),
    errorMessage: directusError?.message ?? error?.message ?? "Unknown failure",
    directusCode: directusError?.extensions?.code ?? null,
    httpStatus: httpStatus ?? null
  });
}
