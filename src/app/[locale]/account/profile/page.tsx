import { KeyRound, UserRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProfileForm } from "@/components/auth/AuthForms";
import { ProfileSummary } from "@/components/account/ProfileSummary";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";
import { requireAccountUser } from "@/lib/auth/account";
import { withDirectusProfilePhone } from "@/lib/auth/user";
import { ensureUserAccountNumber } from "@/lib/directus/account-numbers";
import { getCurrentUserDirectusProfile } from "@/lib/directus/profile";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./page.module.css";

export default async function AccountProfilePage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  const currentUser = await requireAccountUser(params.locale, "/account/profile");
  const provisionedAccount = await ensureUserAccountNumber(currentUser.id);
  const [directusProfile, t] = await Promise.all([
    getCurrentUserDirectusProfile(),
    getTranslations({ locale: params.locale, namespace: "auth" })
  ]);
  const profile = withDirectusProfilePhone(
    currentUser,
    directusProfile.ok ? directusProfile.profile : null
  );
  const accountNumber = directusProfile.ok
    ? (directusProfile.profile?.account_number ??
      (provisionedAccount.ok ? provisionedAccount.accountNumber : null))
    : null;

  return (
    <>
      <div className={styles.profileLayout}>
        <ProfileSummary
          profile={profile}
          accountNumber={accountNumber}
          labels={{
            activeAccount: t("activeAccount"),
            accountInformation: t("accountInformation"),
            accountNumber: t("accountNumber"),
            accountNumberPending: t("accountNumberPending")
          }}
        />

        <section className={styles.informationCard} aria-labelledby="profile-heading">
          <div className={styles.cardHeading}>
            <span aria-hidden="true">
              <UserRound size={22} />
            </span>
            <div>
              <h2 id="profile-heading">{t("personalInformation")}</h2>
              <p>{t("profileSupport")}</p>
            </div>
          </div>
          <ProfileForm
            locale={params.locale}
            profile={profile}
            initialMessage={directusProfile.ok ? undefined : "profileLoadFailed"}
          />
        </section>
      </div>

      <section className={styles.securityCard} aria-labelledby="password-security-heading">
        <div className={styles.securityCopy}>
          <span aria-hidden="true">
            <KeyRound size={22} />
          </span>
          <div>
            <h2 id="password-security-heading">{t("passwordSecurity")}</h2>
            <p>{t("passwordSecuritySupport")}</p>
          </div>
        </div>
        <Button href={localizedPath(params.locale, "/account/change-password")} variant="secondary">
          {t("changePassword")}
        </Button>
      </section>
    </>
  );
}
