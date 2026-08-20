import { setRequestLocale } from "next-intl/server";

import { AdminActivity } from "@/components/admin/AdminActivity";
import type { Locale } from "@/i18n/routing";
import { getAdminUserActivity } from "@/lib/directus/admin-activity";

export default async function AdminActivityPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  const result = await getAdminUserActivity();

  return <AdminActivity locale={params.locale} result={result} />;
}
