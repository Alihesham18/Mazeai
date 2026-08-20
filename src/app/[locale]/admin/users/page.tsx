import { setRequestLocale } from "next-intl/server";
import { AdminUsers } from "@/components/admin/AdminUsers";
import type { Locale } from "@/i18n/routing";
import { getAdminUsers } from "@/lib/directus/admin-users";

function parameter(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams?: {
    page?: string | string[];
    q?: string | string[];
    status?: string | string[];
    role?: string | string[];
  };
}) {
  setRequestLocale(params.locale);
  const result = await getAdminUsers({
    page: parameter(searchParams?.page),
    q: parameter(searchParams?.q),
    status: parameter(searchParams?.status),
    role: parameter(searchParams?.role)
  });
  return <AdminUsers locale={params.locale} result={result} />;
}
