import {
  Award,
  BookOpenCheck,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  TicketPercent,
  Users
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type {
  AdminDashboardActivity,
  AdminDashboardActivityType,
  AdminDashboardData,
  AdminDashboardMetricKey
} from "@/lib/directus/admin-dashboard";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./AdminDashboard.module.css";

const metricDefinitions: Array<{
  key: AdminDashboardMetricKey;
  labelKey: string;
  path: string;
  icon: typeof Users;
}> = [
  { key: "totalUsers", labelKey: "metrics.totalUsers", path: "/admin/users", icon: Users },
  {
    key: "trainingPrograms",
    labelKey: "metrics.trainingPrograms",
    path: "/admin/training/programs",
    icon: GraduationCap
  },
  {
    key: "trainingApplications",
    labelKey: "metrics.trainingApplications",
    path: "/admin/training/applications",
    icon: ClipboardList
  },
  {
    key: "enrolledTrainings",
    labelKey: "metrics.enrolledTrainings",
    path: "/admin/training/enrollments",
    icon: BookOpenCheck
  },
  {
    key: "scholarshipRecords",
    labelKey: "metrics.scholarships",
    path: "/admin/scholarships",
    icon: Award
  },
  {
    key: "discountCodes",
    labelKey: "metrics.discountCodes",
    path: "/admin/discounts",
    icon: TicketPercent
  },
  {
    key: "events",
    labelKey: "metrics.events",
    path: "/admin/events",
    icon: CalendarDays
  },
  {
    key: "eventRegistrations",
    labelKey: "metrics.eventRegistrations",
    path: "/admin/events/registrations",
    icon: CalendarCheck
  }
];

const quickAccess = [
  { labelKey: "navigation.users", path: "/admin/users" },
  { labelKey: "navigation.trainingApplications", path: "/admin/training/applications" },
  { labelKey: "navigation.scholarships", path: "/admin/scholarships" },
  { labelKey: "navigation.eventRegistrations", path: "/admin/events/registrations" },
  { labelKey: "navigation.blog", path: "/admin/blog" }
];

const activityTypeKeys: Record<AdminDashboardActivityType, string> = {
  trainingApplication: "activityTypes.trainingApplication",
  scholarshipAttempt: "activityTypes.scholarshipAttempt",
  eventRegistration: "activityTypes.eventRegistration"
};

const statusKeys: Record<string, string> = {
  submitted: "statuses.submitted",
  under_review: "statuses.underReview",
  accepted: "statuses.accepted",
  rejected: "statuses.rejected",
  eligible: "statuses.eligible",
  not_eligible: "statuses.notEligible",
  completed: "statuses.completed",
  registered: "statuses.registered",
  attended: "statuses.attended",
  cancelled: "statuses.cancelled"
};

function formattedDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function activityStatusKey(activity: AdminDashboardActivity) {
  return statusKeys[activity.status] ?? null;
}

export async function AdminDashboard({
  data,
  locale
}: {
  data: AdminDashboardData;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "adminAuth" });
  const numberFormatter = new Intl.NumberFormat(locale);
  const administratorName = data.administratorFirstName || t("administratorFallback");

  return (
    <div className={styles.dashboard}>
      <header className={styles.heading}>
        <p>{t("dashboard.operationalOverview")}</p>
        <h1>{t("navigation.dashboard")}</h1>
        <span>{t("dashboard.welcomeBack", { name: administratorName })}</span>
      </header>

      <section className={styles.metrics} aria-label={t("dashboard.operationalOverview")}>
        {metricDefinitions.map(({ key, labelKey, path, icon: Icon }) => {
          const value = data.metrics[key];
          return (
            <article className={styles.metricCard} key={key}>
              <span className={styles.metricIcon} aria-hidden="true">
                <Icon size={20} />
              </span>
              <p>{t(labelKey)}</p>
              <strong>
                {value === null ? t("dashboard.unavailable") : numberFormatter.format(value)}
              </strong>
              <Link href={localizedPath(locale, path)}>{t("dashboard.view")}</Link>
            </article>
          );
        })}
      </section>

      <div className={styles.lowerGrid}>
        <section className={styles.panel} aria-labelledby="admin-recent-activity">
          <div className={styles.panelHeading}>
            <h2 id="admin-recent-activity">{t("dashboard.recentActivity")}</h2>
          </div>
          {data.recentActivity === null ? (
            <p className={styles.empty}>{t("dashboard.unavailable")}</p>
          ) : data.recentActivity.length === 0 ? (
            <p className={styles.empty}>{t("dashboard.noRecentActivity")}</p>
          ) : (
            <ul className={styles.activityList}>
              {data.recentActivity.map((activity) => {
                const statusKey = activityStatusKey(activity);
                return (
                  <li key={`${activity.type}-${activity.id}`}>
                    <span>
                      <strong>{t(activityTypeKeys[activity.type])}</strong>
                      {statusKey ? <small>{t(statusKey)}</small> : null}
                    </span>
                    <time dateTime={activity.dateCreated}>
                      {formattedDate(locale, activity.dateCreated)}
                    </time>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="admin-quick-access">
          <div className={styles.panelHeading}>
            <h2 id="admin-quick-access">{t("dashboard.quickAccess")}</h2>
          </div>
          <nav className={styles.quickLinks} aria-label={t("dashboard.quickAccess")}>
            {quickAccess.map((item) => (
              <Link href={localizedPath(locale, item.path)} key={item.path}>
                <span>{t(item.labelKey)}</span>
                <small>{t("dashboard.view")}</small>
              </Link>
            ))}
          </nav>
        </section>
      </div>
    </div>
  );
}
