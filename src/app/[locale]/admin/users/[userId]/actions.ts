"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/i18n/routing";
import {
  requestAdminUserPasswordReset,
  setAdminUserStatus,
  setAdminUserRole,
  type AdminUserMutableStatus,
  type AdminUserPasswordResetResult,
  type AdminUserRole,
  type AdminUserRoleMutationResult,
  type AdminUserStatusMutationResult
} from "@/lib/directus/admin-users";

export interface ChangeAdminUserStatusInput {
  locale: Locale;
  userId: string;
  status: AdminUserMutableStatus;
}

export async function changeAdminUserStatusAction({
  locale,
  userId,
  status
}: ChangeAdminUserStatusInput): Promise<AdminUserStatusMutationResult> {
  /*
   * Security is enforced again inside setAdminUserStatus().
   *
   * That function independently calls requireAdmin(),
   * validates the user ID,
   * validates the requested status,
   * verifies the target user,
   * checks the current status,
   * and prevents self-suspension.
   */
  const result = await setAdminUserStatus(userId, status);

  /*
   * Only refresh admin pages after Directus
   * successfully updates the account.
   */
  if (result.state === "updated") {
    revalidatePath(`/${locale}/admin/users`);
    revalidatePath(`/${locale}/admin/users/${userId}`);
  }

  return result;
}

export async function changeAdminUserRoleAction(input: {
  locale: Locale;
  userId: string;
  role: AdminUserRole;
}): Promise<AdminUserRoleMutationResult> {
  const result = await setAdminUserRole(input.userId, input.role);
  if (result.state === "updated") {
    revalidatePath(`/${input.locale}/admin/users`);
    revalidatePath(`/${input.locale}/admin/users/${input.userId}`);
  }
  return result;
}

export async function requestAdminUserPasswordResetAction(input: {
  locale: Locale;
  userId: string;
}): Promise<AdminUserPasswordResetResult> {
  return requestAdminUserPasswordReset(input.userId, input.locale);
}
