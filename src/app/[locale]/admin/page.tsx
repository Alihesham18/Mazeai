import { setRequestLocale } from "next-intl/server";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import type { Locale } from "@/i18n/routing";

export default async function AdminPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  return <AdminPlaceholder locale={params.locale} titleKey="navigation.dashboard" dashboard />;
}
