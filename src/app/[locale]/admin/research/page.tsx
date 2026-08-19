import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import type { Locale } from "@/i18n/routing";

export default function AdminResearchPage({ params }: { params: { locale: Locale } }) {
  return <AdminPlaceholder locale={params.locale} titleKey="navigation.research" />;
}
