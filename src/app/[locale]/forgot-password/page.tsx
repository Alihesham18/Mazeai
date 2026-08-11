import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });
  return { title: `${t("forgotPassword")} | SynergyMazeAI` };
}

export default async function ForgotPasswordPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });

  return (
    <AuthShell eyebrow={t("accountEyebrow")} title={t("forgotPassword")} supporting={t("forgotSupport")}>
      <ForgotPasswordForm locale={params.locale} />
    </AuthShell>
  );
}
