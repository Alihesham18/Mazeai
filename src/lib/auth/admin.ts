import "server-only";

import { isDirectusError, readMe, withToken } from "@directus/sdk";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { createDirectusRestClient } from "@/lib/directus/client";
import { logDirectusDiagnostic } from "@/lib/directus/diagnostics";
import { getAuthenticatedDirectusSession, readDirectusSession } from "@/lib/directus/auth";
import { localizedPath } from "@/lib/utilities/localize";

const adminUserFields = ["id", "email", "first_name", "last_name", "status", "role"] as const;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface AdminPrincipal {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
}

export type AdminAuthorizationFailure =
  "unauthenticated" | "forbidden" | "configuration" | "backendFailure";

export type AdminAuthorizationResult =
  | { authorized: true; principal: AdminPrincipal }
  | { authorized: false; reason: AdminAuthorizationFailure };

interface AdminPageContext {
  locale: Locale;
  destination?: string;
}

class AdminAuthorizationError extends Error {
  readonly reason: AdminAuthorizationFailure;

  constructor(reason: AdminAuthorizationFailure) {
    super("Admin authorization failed");
    this.name = "AdminAuthorizationError";
    this.reason = reason;
  }
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string) {
  return uuidPattern.test(value);
}

export function normalizeDirectusRoleId(role: unknown) {
  const value =
    typeof role === "string"
      ? role.trim()
      : role && typeof role === "object" && "id" in role
        ? text((role as { id?: unknown }).id)
        : "";

  return isUuid(value) ? value.toLowerCase() : null;
}

function configuredAdminRoleId() {
  const roleId = text(process.env.DIRECTUS_ADMIN_ROLE_ID);
  return isUuid(roleId) ? roleId.toLowerCase() : null;
}

function logConfigurationFailure() {
  logDirectusDiagnostic(
    "admin.authorization.configuration",
    new Error("Admin role authorization is not configured")
  );
}

function isDirectusForbidden(caught: unknown) {
  if (!isDirectusError(caught)) return false;

  return caught.errors.some((error) => {
    const code = text(error.extensions?.code).toLowerCase();
    const status = error.extensions?.status;
    return code === "forbidden" || status === 403;
  });
}

export async function getAdminAuthorization(): Promise<AdminAuthorizationResult> {
  const existingSession = readDirectusSession();
  if (!existingSession) return { authorized: false, reason: "unauthenticated" };

  const expectedRoleId = configuredAdminRoleId();
  const client = createDirectusRestClient();
  if (!expectedRoleId || !client) {
    logConfigurationFailure();
    return { authorized: false, reason: "configuration" };
  }

  const session = await getAuthenticatedDirectusSession();
  if (!session) {
    logDirectusDiagnostic(
      "admin.authorization.session",
      new Error("Authenticated session could not be established")
    );
    return { authorized: false, reason: "backendFailure" };
  }

  try {
    const user = await client.request(
      withToken(session.accessToken, readMe({ fields: adminUserFields }))
    );
    const roleId = normalizeDirectusRoleId(user.role);
    const id = text(user.id);
    const email = text(user.email);

    if (text(user.status).toLowerCase() !== "active" || roleId !== expectedRoleId) {
      return { authorized: false, reason: "forbidden" };
    }

    if (!isUuid(id) || !email) {
      return { authorized: false, reason: "forbidden" };
    }

    return {
      authorized: true,
      principal: {
        id: id.toLowerCase(),
        email,
        firstName: text(user.first_name),
        lastName: text(user.last_name),
        roleId
      }
    };
  } catch (caught) {
    logDirectusDiagnostic("admin.authorization.read-current-user", caught);
    return {
      authorized: false,
      reason: isDirectusForbidden(caught) ? "forbidden" : "backendFailure"
    };
  }
}

function safeAdminDestination(destination = "/admin") {
  return destination === "/admin" || destination.startsWith("/admin/") ? destination : "/admin";
}

export async function requireAdmin(context?: AdminPageContext): Promise<AdminPrincipal> {
  const result = await getAdminAuthorization();
  if (result.authorized) return result.principal;

  if (context && result.reason === "unauthenticated") {
    const loginPath = localizedPath(context.locale, "/login");
    const returnPath = localizedPath(context.locale, safeAdminDestination(context.destination));
    redirect(`${loginPath}?next=${encodeURIComponent(returnPath)}`);
  }

  if (context) notFound();

  // Future admin actions must call requireAdmin() independently and fail closed.
  throw new AdminAuthorizationError(result.reason);
}
