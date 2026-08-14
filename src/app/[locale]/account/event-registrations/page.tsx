import { CalendarCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";
import { requireAccountUser } from "@/lib/auth/account";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "../page.module.css";

export default async function EventRegistrationsPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  await requireAccountUser(params.locale, "/account/event-registrations");
  const t = await getTranslations({ locale: params.locale, namespace: "auth" });

  return (
    <section className={styles.panel} aria-labelledby="event-registrations-heading">
      <div className={styles.panelHeading}>
        <span className={styles.headingIcon} aria-hidden="true">
          <CalendarCheck size={22} />
        </span>
        <div>
          <h2 id="event-registrations-heading">{t("eventRegistrations")}</h2>
          <p>{t("eventRegistrationsSupport")}</p>
        </div>
      </div>
      <div className={styles.emptyState}>
        <CalendarCheck size={36} aria-hidden="true" />
        <strong>{t("noEventRegistrations")}</strong>
        <p>{t("noEventRegistrationsSupport")}</p>
        <Button href={localizedPath(params.locale, "/events")}>{t("browseEvents")}</Button>
      </div>
    </section>
  );
}
