import { CalendarCheck, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/i18n/routing";
import { requireAccountUser } from "@/lib/auth/account";
import { getCurrentUserEventRegistrations } from "@/lib/directus/events";
import { formatAccountDate } from "@/lib/utilities/account";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "../page.module.css";

export default async function EventRegistrationsPage({ params }: { params: { locale: Locale } }) {
  setRequestLocale(params.locale);
  await requireAccountUser(params.locale, "/account/event-registrations");
  const [result, t] = await Promise.all([
    getCurrentUserEventRegistrations(),
    getTranslations({ locale: params.locale, namespace: "auth" })
  ]);
  const registrations = result.ok ? result.data : [];
  const statusLabel = (status: (typeof registrations)[number]["status"]) =>
    t(`eventRegistrationStatus.${status}`);

  return (
    <section className={styles.panel} aria-labelledby="event-registrations-heading">
      <div className={styles.panelHeading}>
        <span className={styles.headingIcon} aria-hidden="true"><CalendarCheck size={22} /></span>
        <div><h2 id="event-registrations-heading">{t("eventRegistrations")}</h2><p>{t("eventRegistrationsSupport")}</p></div>
      </div>
      {!result.ok ? (
        <p className={styles.panelMessage} role="alert">{t("eventRegistrationsUnavailable")}</p>
      ) : registrations.length === 0 ? (
        <div className={styles.emptyState}>
          <CalendarCheck size={36} aria-hidden="true" />
          <strong>{t("noEventRegistrations")}</strong>
          <p>{t("noEventRegistrationsSupport")}</p>
          <Button href={localizedPath(params.locale, "/events")}>{t("browseEvents")}</Button>
        </div>
      ) : (
        <ul className={styles.scholarshipList}>
          {registrations.map((registration) => {
            const event = typeof registration.event === "number" ? null : registration.event;
            const registeredAt = formatAccountDate(registration.date_created, params.locale);
            const eventDate = formatAccountDate(event?.event_date ?? null, params.locale);
            return (
              <li className={styles.standardAttempt} key={registration.id}>
                <div className={styles.attemptHeader}>
                  {event ? <Link href={localizedPath(params.locale, `/events/${event.slug}`)}>{event.title}</Link> : <strong>{t("event")}</strong>}
                  <span className={styles.statusBadge}>{statusLabel(registration.status)}</span>
                </div>
                <div className={styles.attemptDetails}>
                  <dl className={styles.metrics}>
                    {eventDate ? <div><dt>{t("eventDate")}</dt><dd><CalendarDays size={15} aria-hidden="true" /> {eventDate}</dd></div> : null}
                    <div><dt>{t("registeredOn")}</dt><dd>{registeredAt || "—"}</dd></div>
                    {event?.location || event?.format ? <div><dt>{t("eventLocationFormat")}</dt><dd><MapPin size={15} aria-hidden="true" /> {[event.location, event.format].filter(Boolean).join(" · ")}</dd></div> : null}
                  </dl>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
