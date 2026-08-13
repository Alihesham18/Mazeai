import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UpdatePasswordForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });
  return { title: `${t("updatePassword")} | SynergyMazeAI` };
}

export default async function UpdatePasswordPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams: { token?: string };
}) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });
  return (
    <AuthShell eyebrow={t("accountEyebrow")} title={t("updatePassword")} supporting={t("updatePasswordSupport")}>
      <UpdatePasswordForm locale={params.locale} token={searchParams.token} />
    </AuthShell>
  );
}
