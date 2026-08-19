import type { ReactNode } from "react";
import type { Locale } from "@/i18n/routing";
import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { locale: Locale };
}) {
  await requireAdmin({ locale: params.locale, destination: "/admin" });
  return children;
}
