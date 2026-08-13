import type { Metadata } from "next";
import { BookOpenCheck, CalendarCheck, ClipboardList, Medal } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/auth/AuthForms";
import { Container } from "@/components/ui/Container";
import { getCurrentUserProfile, withDirectusProfilePhone } from "@/lib/auth/user";
import { getCurrentUserDirectusProfile } from "@/lib/directus/profile";
import type { Locale } from "@/i18n/routing";
import styles from "./page.module.css";

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

  const directusProfile = await getCurrentUserDirectusProfile();
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
      id: "applications",
      icon: ClipboardList,
      title: t("trainingApplications"),
      empty: t("noTrainingApplications")
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
