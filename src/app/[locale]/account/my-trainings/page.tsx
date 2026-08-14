import { BookOpenCheck, GraduationCap } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";
import { requireAccountUser } from "@/lib/auth/account";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "../page.module.css";

export default async function MyTrainingsPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  await requireAccountUser(params.locale, "/account/my-trainings");
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });

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
      <div className={styles.emptyState}>
        <GraduationCap size={36} aria-hidden="true" />
        <strong>{t("noTrainings")}</strong>
        <p>{t("noTrainingsSupport")}</p>
        <Button href={localizedPath(params.locale, "/training")}>{t("browseTrainings")}</Button>
      </div>
    </section>
  );
}
