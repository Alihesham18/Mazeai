import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
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
  const admin = await requireAdmin({ locale: params.locale, destination: "/admin" });

  return (
    <AdminShell
      locale={params.locale}
      identity={{
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName
      }}
    >
      {children}
    </AdminShell>
  );
}
