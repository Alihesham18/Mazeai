import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";
import type { AuthMessageCode } from "@/lib/auth/types";
import { getCurrentUserProfile } from "@/lib/auth/user";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });
  return { title: `${t("logIn")} | SynergyMazeAI` };
}

export default async function LoginPage({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams: { next?: string; error?: string; reason?: string };
}) {
  setRequestLocale(params.locale);
  const user = await getCurrentUserProfile();
  if (user) redirect(`/${params.locale}/account`);

  const t = await getTranslations({ locale: params.locale, namespace: "auth" });
  const initialMessage: AuthMessageCode | undefined =
    searchParams.reason === "session-expired"
      ? "sessionExpired"
      : searchParams.error
        ? "serverFailure"
        : undefined;

  return (
    <AuthShell eyebrow={t("accountEyebrow")} title={t("welcomeBack")} supporting={t("loginSupport")}>
      <LoginForm locale={params.locale} next={searchParams.next} initialMessage={initialMessage} />
    </AuthShell>
  );
}
