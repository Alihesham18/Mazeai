import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";
import { getCurrentUserProfile } from "@/lib/auth/user";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });
  return { title: `${t("createAccount")} | SynergyMazeAI` };
}

export default async function RegisterPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  const user = await getCurrentUserProfile();
  if (user) redirect(`/${params.locale}/account`);

  const t = await getTranslations({ locale: params.locale, namespace: "auth" });
  return (
    <AuthShell eyebrow={t("accountEyebrow")} title={t("createAccount")} supporting={t("registerSupport")}>
      <RegisterForm locale={params.locale} />
    </AuthShell>
  );
}
