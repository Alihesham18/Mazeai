import { ShieldCheck } from "lucide-react";
import type { AuthProfile } from "@/lib/auth/types";
import { profileInitials } from "@/lib/utilities/profile";
import styles from "./ProfileSummary.module.css";

export function ProfileSummary({
  profile,
  accountNumber,
  labels
}: {
  profile: AuthProfile;
  accountNumber: string | null;
  labels: {
    activeAccount: string;
    accountInformation: string;
    accountNumber: string;
    accountNumberPending: string;
  };
}) {
  const initials = profileInitials(profile.firstName, profile.lastName, profile.email);

  return (
    <aside className={styles.card} aria-labelledby="account-information-heading">
      <div className={styles.avatar} aria-hidden="true">
        {initials}
      </div>
      <div className={styles.identity}>
        <h2>{profile.fullName || profile.email}</h2>
        <p dir="ltr">{profile.email}</p>
      </div>
      {profile.status === "active" ? (
        <span className={styles.activeBadge}>
          <ShieldCheck size={15} aria-hidden="true" />
          {labels.activeAccount}
        </span>
      ) : null}
      <div className={styles.accountInformation}>
        <h3 id="account-information-heading">{labels.accountInformation}</h3>
        <span>{labels.accountNumber}</span>
        {accountNumber ? (
          <code dir="ltr">{accountNumber}</code>
        ) : (
          <p>{labels.accountNumberPending}</p>
        )}
      </div>
    </aside>
  );
}
