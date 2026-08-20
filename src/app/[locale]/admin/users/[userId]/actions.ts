"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/i18n/routing";
import {
  setAdminUserStatus,
  type AdminUserMutableStatus,
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