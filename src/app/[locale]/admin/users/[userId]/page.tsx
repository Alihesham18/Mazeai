import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AdminUserDetail } from "@/components/admin/AdminUsers";
import type { Locale } from "@/i18n/routing";
import { getAdminUserById } from "@/lib/directus/admin-users";

export default async function AdminUserDetailPage({
  params
}: {
  params: { locale: Locale; userId: string };
}) {
  setRequestLocale(params.locale);
  const result = await getAdminUserById(params.userId);
  if (result.state === "notFound") notFound();

  return (
    <AdminUserDetail locale={params.locale} user={result.state === "ready" ? result.user : null} />
  );
}
