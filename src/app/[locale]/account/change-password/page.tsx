import { KeyRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChangePasswordForm } from "@/components/auth/AuthForms";
import type { Locale } from "@/i18n/routing";
import { requireAccountUser } from "@/lib/auth/account";
import styles from "./page.module.css";

export default async function ChangePasswordPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  await requireAccountUser(params.locale, "/account/change-password");
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });

  return (
    <section className={styles.card} aria-labelledby="change-password-heading">
      <div className={styles.heading}>
        <span aria-hidden="true">
          <KeyRound size={22} />
        </span>
        <div>
          <h2 id="change-password-heading">{t("changePassword")}</h2>
          <p>{t("passwordSecuritySupport")}</p>
        </div>
      </div>
      <ChangePasswordForm locale={params.locale} />
    </section>
  );
}
