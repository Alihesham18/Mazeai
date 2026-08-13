import type { Metadata } from "next";
import { BookOpenCheck, CalendarCheck, ClipboardList, Medal } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/auth/AuthForms";
import { Container } from "@/components/ui/Container";
import { getCurrentUserProfile, withDirectusProfilePhone } from "@/lib/auth/user";
import { getCurrentUserDirectusProfile } from "@/lib/directus/profile";
import { getCurrentUserTrainingApplications } from "@/lib/directus/training";
import Link from "next/link";
import { localizedPath } from "@/lib/utilities/localize";
import type { Locale } from "@/i18n/routing";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });
  return { title: `${t("myAccount")} | SynergyMazeAI` };
}

export default async function AccountPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  const currentUser = await getCurrentUserProfile();

  if (!currentUser) {
    redirect(`/${params.locale}/login?next=/${params.locale}/account`);
  }

  const [directusProfile, applicationResult] = await Promise.all([
    getCurrentUserDirectusProfile(),
    getCurrentUserTrainingApplications()
  ]);
  const profile = withDirectusProfilePhone(
    currentUser,
    directusProfile.ok ? directusProfile.profile : null
  );

  const t = await getTranslations({ locale: params.locale, namespace: "auth" });
  const sections = [
    {
      id: "trainings",
      icon: BookOpenCheck,
      title: t("myTrainings"),
      empty: t("noTrainings")
    },
    {
      id: "scholarship-exams",
      icon: Medal,
      title: t("scholarshipExams"),
      empty: t("noScholarshipExams")
    },
    {
      id: "event-registrations",
      icon: CalendarCheck,
      title: t("eventRegistrations"),
      empty: t("noEventRegistrations")
    }
  ];
  const applications = applicationResult.ok ? applicationResult.data : [];
  const statusLabel = (status: (typeof applications)[number]["status"]) => {
    switch (status) {
      case "under_review":
        return t("trainingStatus.underReview");
      case "accepted":
        return t("trainingStatus.accepted");
      case "rejected":
        return t("trainingStatus.rejected");
      default:
        return t("trainingStatus.submitted");
    }
  };

  return (
    <article className={styles.page}>
      <Container>
        <header className={styles.header}>
          <p>{t("accountEyebrow")}</p>
          <h1>{t("myAccount")}</h1>
          <span>{t("accountSupport")}</span>
        </header>

        <section className={styles.profile} aria-labelledby="profile-heading">
          <div className={styles.sectionHeading}>
            <h2 id="profile-heading">{t("profile")}</h2>
            <p>{t("profileSupport")}</p>
          </div>
          <ProfileForm
            locale={params.locale}
            profile={profile}
            initialMessage={directusProfile.ok ? undefined : "profileLoadFailed"}
          />
        </section>

        <div className={styles.sections}>
          <section id="applications" className={styles.emptySection} aria-labelledby="applications-heading">
            <ClipboardList size={22} aria-hidden="true" />
            <div className={styles.applicationContent}>
              <h2 id="applications-heading">{t("trainingApplications")}</h2>
              {!applicationResult.ok ? (
                <p>{t("applicationsUnavailable")}</p>
              ) : applications.length === 0 ? (
                <p>{t("noTrainingApplications")}</p>
              ) : (
                <ul className={styles.applicationList}>
                  {applications.map((application) => (
                    <li key={application.id}>
                      <div>
                        {application.program ? (
                          <Link href={localizedPath(params.locale, `/training/${application.program.slug}`)}>
                            {application.program.title}
                          </Link>
                        ) : (
                          <strong>{t("trainingProgram")}</strong>
                        )}
                        {application.dateCreated ? (
                          <time dateTime={application.dateCreated}>
                            {new Intl.DateTimeFormat(params.locale, { dateStyle: "medium" }).format(
                              new Date(application.dateCreated)
                            )}
                          </time>
                        ) : null}
                      </div>
                      <span className={styles.applicationStatus}>{statusLabel(application.status)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
          {sections.map(({ id, icon: Icon, title, empty }) => (
            <section key={id} id={id} className={styles.emptySection} aria-labelledby={`${id}-heading`}>
              <Icon size={22} aria-hidden="true" />
              <div>
                <h2 id={`${id}-heading`}>{title}</h2>
                <p>{empty}</p>
              </div>
            </section>
          ))}
        </div>
      </Container>
    </article>
  );
}
