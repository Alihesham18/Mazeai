import {
  ArrowUpRight,
  BookOpenCheck,
  CalendarCheck,
  ClipboardList,
  Medal,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegacyAccountHashRedirect } from "@/components/account/LegacyAccountHashRedirect";
import type { Locale } from "@/i18n/routing";
import { requireAccountUser } from "@/lib/auth/account";
import { getCurrentUserScholarshipAttempts } from "@/lib/directus/scholarship";
import { getCurrentUserTrainingApplications } from "@/lib/directus/training";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./page.module.css";

export default async function AccountOverviewPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  await requireAccountUser(params.locale);

  const [applicationResult, scholarshipResult, t] = await Promise.all([
    getCurrentUserTrainingApplications(),
    getCurrentUserScholarshipAttempts(),
    getTranslations({ locale: params.locale, namespace: "auth" })
  ]);
  const applications = applicationResult.ok ? applicationResult.data : [];
  const attempts = scholarshipResult.ok ? scholarshipResult.data : [];
  const latestApplication = applications[0] ?? null;
  const latestAttempt = attempts[0] ?? null;
  const eligibleCount = attempts.filter((attempt) => attempt.status === "eligible").length;

  const applicationStatus = latestApplication
    ? latestApplication.status === "under_review"
      ? t("trainingStatus.underReview")
      : latestApplication.status === "accepted"
        ? t("trainingStatus.accepted")
        : latestApplication.status === "rejected"
          ? t("trainingStatus.rejected")
          : t("trainingStatus.submitted")
    : null;
  const attemptStatus = latestAttempt
    ? latestAttempt.status === "eligible"
      ? t("scholarshipStatus.eligible")
      : latestAttempt.status === "not_eligible"
        ? t("scholarshipStatus.notEligible")
        : latestAttempt.status === "under_review"
          ? t("scholarshipStatus.underReview")
          : t("scholarshipStatus.completed")
    : null;

  const cards = [
    {
      title: t("trainingApplications"),
      icon: ClipboardList,
      value: applicationResult.ok ? applications.length : null,
      valueLabel: t("totalApplications"),
      latest: latestApplication?.program?.title ?? null,
      latestStatus: applicationStatus,
      error: applicationResult.ok ? null : t("applicationsUnavailable"),
      href: localizedPath(params.locale, "/account/training-applications"),
      action: t("viewApplications")
    },
    {
      title: t("scholarshipExams"),
      icon: Medal,
      value: scholarshipResult.ok ? attempts.length : null,
      valueLabel: t("totalAttempts"),
      secondaryValue: scholarshipResult.ok ? eligibleCount : null,
      secondaryLabel: t("scholarshipStatus.eligible"),
      latest: latestAttempt?.program?.title ?? null,
      latestStatus: attemptStatus,
      error: scholarshipResult.ok ? null : t("scholarshipAttemptsUnavailable"),
      href: localizedPath(params.locale, "/account/scholarship-exams"),
      action: t("viewScholarshipExams")
    },
    {
      title: t("myTrainings"),
      icon: BookOpenCheck,
      value: 0,
      valueLabel: t("enrolled"),
      href: localizedPath(params.locale, "/account/my-trainings"),
      action: t("viewMyTrainings")
    },
    {
      title: t("eventRegistrations"),
      icon: CalendarCheck,
      value: 0,
      valueLabel: t("registered"),
      href: localizedPath(params.locale, "/account/event-registrations"),
      action: t("viewEventRegistrations")
    }
  ];

  return (
    <>
      <LegacyAccountHashRedirect locale={params.locale} />
      <div className={styles.overviewHeading}>
        <div>
          <h2>{t("overview")}</h2>
          <p>{t("overviewSupport")}</p>
        </div>
        <Link
          className={styles.profileShortcut}
          href={localizedPath(params.locale, "/account/profile")}
        >
          <UserRound size={17} aria-hidden="true" />
          {t("manageProfile")}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className={styles.summaryGrid}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <section className={styles.summaryCard} key={card.href}>
              <div className={styles.summaryTitle}>
                <span className={styles.headingIcon} aria-hidden="true">
                  <Icon size={21} />
                </span>
                <h3>{card.title}</h3>
              </div>

              {card.error ? (
                <p className={styles.summaryError}>{card.error}</p>
              ) : (
                <div className={styles.summaryStats}>
                  <p>
                    <strong dir="ltr">{card.value}</strong>
                    <span>{card.valueLabel}</span>
                  </p>
                  {card.secondaryValue !== undefined ? (
                    <p>
                      <strong dir="ltr">{card.secondaryValue}</strong>
                      <span>{card.secondaryLabel}</span>
                    </p>
                  ) : null}
                </div>
              )}

              {card.latest ? (
                <p className={styles.latestActivity}>
                  <span>{t("latest")}</span>
                  <strong>{card.latest}</strong>
                  {card.latestStatus ? <small>{card.latestStatus}</small> : null}
                </p>
              ) : null}

              <Link className={styles.summaryLink} href={card.href}>
                {card.action}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </section>
          );
        })}
      </div>
    </>
  );
}
