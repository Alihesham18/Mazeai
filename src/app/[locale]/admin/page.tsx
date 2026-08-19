import { setRequestLocale } from "next-intl/server";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import type { Locale } from "@/i18n/routing";
import { getAdminDashboardData } from "@/lib/directus/admin-dashboard";

export default async function AdminPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  const data = await getAdminDashboardData();
  return <AdminDashboard data={data} locale={params.locale} />;
}
