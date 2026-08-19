import {
  Award,
  BookOpenCheck,
  Clock3,
  GraduationCap,
  MapPin,
  Presentation,
  UserRound
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { TrainingDiscountPricing } from "@/components/account/TrainingDiscountPricing";
import type { Locale } from "@/i18n/routing";
import { requireAccountUser } from "@/lib/auth/account";
import {
  getCurrentUserAcceptedTrainingApplications,
  getLocalizedPublishedTrainingPrograms
} from "@/lib/directus/training";
import { getTrainingDiscountOverview } from "@/lib/directus/training-discounts";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "../page.module.css";

export default async function MyTrainingsPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  const currentUser = await requireAccountUser(params.locale, "/account/my-trainings");
  const [trainingResult, localizedResult, t] = await Promise.all([
    getCurrentUserAcceptedTrainingApplications(),
    getLocalizedPublishedTrainingPrograms(params.locale),
    getTranslations({ locale: params.locale, namespace: "auth" })
  ]);
  const trainings = trainingResult.ok ? trainingResult.data : [];
  const localizedPrograms = new Map(
    (localizedResult.ok ? localizedResult.data : []).map((program) => [program.slug, program])
  );
  const discountResult = trainings.length
    ? await getTrainingDiscountOverview(currentUser.id, trainings)
    : { ok: true as const, data: {} };

  return (
    <section className={styles.panel} aria-labelledby="trainings-heading">
      <div className={styles.panelHeading}>
        <span className={styles.headingIcon} aria-hidden="true">
          <BookOpenCheck size={22} />
        </span>
        <div>
          <h2 id="trainings-heading">{t("myTrainings")}</h2>
          <p>{t("myTrainingsSupport")}</p>
        </div>
      </div>
      {!trainingResult.ok ? (
        <p className={styles.panelMessage} role="alert">{t("trainingsUnavailable")}</p>
      ) : trainings.length === 0 ? (
        <div className={styles.emptyState}>
          <GraduationCap size={36} aria-hidden="true" />
          <strong>{t("noTrainings")}</strong>
          <p>{t("noTrainingsSupport")}</p>
          <Button href={localizedPath(params.locale, "/training")}>{t("browseTrainings")}</Button>
        </div>
      ) : (
        <ul className={styles.trainingList}>
          {trainings.map(({ applicationId, program }) => {
            const localizedProgram = localizedPrograms.get(program.slug);
            const title = localizedProgram?.title ?? program.title;
            const shortDescription =
              localizedProgram?.shortDescription ?? program.short_description;
            const instructorRole = localizedProgram?.instructorRole ?? program.instructor_role;

            return (
            <li className={styles.trainingCard} key={applicationId}>
              <div className={styles.trainingCardHeader}>
                <div>
                  <span>{program.category}</span>
                  <h3>{title}</h3>
                </div>
                <span className={[styles.statusBadge, styles.statusPositive].join(" ")}>
                  {t("trainingStatus.accepted")}
                </span>
              </div>

              {shortDescription ? (
                <p className={styles.trainingDescription}>{shortDescription}</p>
              ) : null}

              <dl className={styles.trainingDetails}>
                {program.format ? (
                  <div>
                    <dt><Presentation size={16} aria-hidden="true" />{t("trainingFormat")}</dt>
                    <dd>{program.format}</dd>
                  </div>
                ) : null}
                {program.duration_hours !== null ? (
                  <div>
                    <dt><Clock3 size={16} aria-hidden="true" />{t("trainingDuration")}</dt>
                    <dd>
                      {new Intl.NumberFormat(params.locale).format(program.duration_hours)} {t("trainingHours")}
                    </dd>
                  </div>
                ) : null}
                {program.location ? (
                  <div>
                    <dt><MapPin size={16} aria-hidden="true" />{t("trainingLocation")}</dt>
                    <dd>{program.location}</dd>
                  </div>
                ) : null}
                <div>
                  <dt><Award size={16} aria-hidden="true" />{t("trainingCertificate")}</dt>
                  <dd>
                    {program.certificate_available
                      ? t("trainingCertificateAvailable")
                      : t("trainingCertificateUnavailable")}
                  </dd>
                </div>
                {program.instructor_name ? (
                  <div>
                    <dt><UserRound size={16} aria-hidden="true" />{t("trainingInstructor")}</dt>
                    <dd>
                      {program.instructor_name}
                      {instructorRole ? <small>{instructorRole}</small> : null}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {program.fee !== null ? (
                <TrainingDiscountPricing
                  locale={params.locale}
                  applicationId={applicationId}
                  originalFee={program.fee}
                  currency={program.currency}
                  overview={
                    discountResult.ok
                      ? (discountResult.data[applicationId] ?? { available: [], applied: null })
                      : { available: [], applied: null }
                  }
                  unavailable={!discountResult.ok}
                />
              ) : null}

              <Button
                href={localizedPath(params.locale, `/training/${program.slug}`)}
                variant="secondary"
              >
                {t("viewTraining")}
              </Button>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
