import { CalendarDays, Medal, RotateCcw } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CopyDiscountCode } from "@/components/account/CopyDiscountCode";
import { Button } from "@/components/ui/Button";
import { getScholarshipExam } from "@/data/scholarship-exams";
import type { Locale } from "@/i18n/routing";
import { requireAccountUser } from "@/lib/auth/account";
import { getCurrentUserScholarshipAttempts } from "@/lib/directus/scholarship";
import { formatAccountDate } from "@/lib/utilities/account";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "../page.module.css";

export default async function ScholarshipExamsPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  await requireAccountUser(params.locale, "/account/scholarship-exams");
  const [scholarshipResult, t] = await Promise.all([
    getCurrentUserScholarshipAttempts(),
    getTranslations({ locale: params.locale, namespace: "auth" })
  ]);
  const attempts = scholarshipResult.ok ? scholarshipResult.data : [];
  const statusLabel = (status: (typeof attempts)[number]["status"]) => {
    if (status === "eligible") return t("scholarshipStatus.eligible");
    if (status === "not_eligible") return t("scholarshipStatus.notEligible");
    if (status === "under_review") return t("scholarshipStatus.underReview");
    return t("scholarshipStatus.completed");
  };

  return (
    <section className={styles.panel} aria-labelledby="scholarship-exams-heading">
      <div className={styles.panelHeading}>
        <span className={styles.headingIcon} aria-hidden="true">
          <Medal size={22} />
        </span>
        <div>
          <h2 id="scholarship-exams-heading">{t("scholarshipExams")}</h2>
          <p>{t("scholarshipExamsSupport")}</p>
        </div>
      </div>

      {!scholarshipResult.ok ? (
        <p className={styles.panelMessage}>{t("scholarshipAttemptsUnavailable")}</p>
      ) : attempts.length === 0 ? (
        <div className={styles.emptyState}>
          <Medal size={36} aria-hidden="true" />
          <strong>{t("noScholarshipExams")}</strong>
          <Button href={localizedPath(params.locale, "/training")}>{t("browseTrainings")}</Button>
        </div>
      ) : (
        <ul className={styles.scholarshipList}>
          {attempts.map((attempt) => {
            const eligible = attempt.status === "eligible";
            const showAward = eligible && attempt.scholarshipPercentage !== null;
            const showCode = eligible && Boolean(attempt.discountCode?.trim());
            const date = formatAccountDate(attempt.dateCreated, params.locale);
            const canRetake = attempt.program && getScholarshipExam(attempt.program.slug);

            return (
              <li
                className={eligible ? styles.eligibleAttempt : styles.standardAttempt}
                key={attempt.id}
              >
                <div className={styles.attemptHeader}>
                  {attempt.program ? (
                    <Link href={localizedPath(params.locale, `/training/${attempt.program.slug}`)}>
                      {attempt.program.title}
                    </Link>
                  ) : (
                    <strong>{t("trainingProgram")}</strong>
                  )}
                  <span
                    className={[
                      styles.statusBadge,
                      eligible
                        ? styles.statusPositive
                        : attempt.status === "not_eligible"
                          ? styles.statusNegative
                          : styles.statusPending
                    ].join(" ")}
                  >
                    {statusLabel(attempt.status)}
                  </span>
                </div>

                <div className={styles.attemptDetails}>
                  <div className={styles.attemptSummary}>
                    <dl className={styles.metrics}>
                      <div>
                        <dt>{t("scholarshipScore")}</dt>
                        <dd dir="ltr">
                          {attempt.score} / {attempt.totalQuestions}
                        </dd>
                      </div>
                      <div>
                        <dt>{t("scholarshipPercentage")}</dt>
                        <dd dir="ltr">{attempt.percentage}%</dd>
                      </div>
                    </dl>
                    {date ? (
                      <time dateTime={attempt.dateCreated ?? undefined}>
                        <CalendarDays size={15} aria-hidden="true" />
                        {date}
                      </time>
                    ) : null}
                    {canRetake && attempt.program ? (
                      <Link
                        className={styles.retakeLink}
                        href={localizedPath(
                          params.locale,
                          `/training/${attempt.program.slug}/scholarship`
                        )}
                      >
                        <RotateCcw size={15} aria-hidden="true" />
                        {t("takeAgain")}
                      </Link>
                    ) : null}
                  </div>

                  {showAward || showCode ? (
                    <div className={styles.awardPanel}>
                      {showAward ? (
                        <p>
                          <span>{t("scholarshipAward")}</span>
                          <strong dir="ltr">{attempt.scholarshipPercentage}%</strong>
                        </p>
                      ) : null}
                      {showCode && attempt.discountCode ? (
                        <div className={styles.codeBlock}>
                          <span>{t("discountCode")}</span>
                          <div className={styles.codeRow}>
                            <code dir="ltr">{attempt.discountCode}</code>
                            <CopyDiscountCode
                              code={attempt.discountCode}
                              copyLabel={t("copyCode")}
                              copiedLabel={t("copied")}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
