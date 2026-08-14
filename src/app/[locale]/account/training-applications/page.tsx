import { CalendarDays, ClipboardList } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";
import { requireAccountUser } from "@/lib/auth/account";
import { getCurrentUserTrainingApplications } from "@/lib/directus/training";
import { formatAccountDate } from "@/lib/utilities/account";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "../page.module.css";

export default async function TrainingApplicationsPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  await requireAccountUser(params.locale, "/account/training-applications");
  const [applicationResult, t] = await Promise.all([
    getCurrentUserTrainingApplications(),
    getTranslations({ locale: params.locale, namespace: "auth" })
  ]);
  const applications = applicationResult.ok ? applicationResult.data : [];
  const statusLabel = (status: (typeof applications)[number]["status"]) => {
    if (status === "under_review") return t("trainingStatus.underReview");
    if (status === "accepted") return t("trainingStatus.accepted");
    if (status === "rejected") return t("trainingStatus.rejected");
    return t("trainingStatus.submitted");
  };
  const statusClass = (status: (typeof applications)[number]["status"]) => {
    if (status === "accepted") return styles.statusPositive;
    if (status === "rejected") return styles.statusNegative;
    return styles.statusPending;
  };

  return (
    <section className={styles.panel} aria-labelledby="applications-heading">
      <div className={styles.panelHeading}>
        <span className={styles.headingIcon} aria-hidden="true">
          <ClipboardList size={22} />
        </span>
        <div>
          <h2 id="applications-heading">{t("trainingApplications")}</h2>
          <p>{t("trainingApplicationsSupport")}</p>
        </div>
      </div>

      {!applicationResult.ok ? (
        <p className={styles.panelMessage}>{t("applicationsUnavailable")}</p>
      ) : applications.length === 0 ? (
        <div className={styles.emptyState}>
          <ClipboardList size={36} aria-hidden="true" />
          <strong>{t("noTrainingApplications")}</strong>
          <Button href={localizedPath(params.locale, "/training")}>{t("browseTrainings")}</Button>
        </div>
      ) : (
        <ul className={styles.applicationList}>
          {applications.map((application) => {
            const date = formatAccountDate(application.dateCreated, params.locale);
            return (
              <li key={application.id}>
                <div>
                  {application.program ? (
                    <Link
                      href={localizedPath(params.locale, `/training/${application.program.slug}`)}
                    >
                      {application.program.title}
                    </Link>
                  ) : (
                    <strong>{t("trainingProgram")}</strong>
                  )}
                  {date ? (
                    <time dateTime={application.dateCreated ?? undefined}>
                      <CalendarDays size={15} aria-hidden="true" />
                      {date}
                    </time>
                  ) : null}
                </div>
                <span className={[styles.statusBadge, statusClass(application.status)].join(" ")}>
                  {statusLabel(application.status)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
