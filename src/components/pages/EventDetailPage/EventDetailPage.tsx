import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Ticket, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EventRegistrationForm } from "@/components/events/EventRegistrationForm";
import { Container } from "@/components/ui/Container";
import { eventDetailCopy } from "@/data/featured-events";
import type { Locale } from "@/i18n/routing";
import { getCurrentUserProfile } from "@/lib/auth/user";
import type { DirectusEvent } from "@/lib/directus/types";
import { localize, localizedPath } from "@/lib/utilities/localize";
import styles from "./EventDetailPage.module.css";

function formatEventDate(value: string | null, locale: Locale) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(parsed);
}

export async function EventDetailPage({ event, locale }: { event: DirectusEvent; locale: Locale }) {
  setRequestLocale(locale);
  const [user, t] = await Promise.all([
    getCurrentUserProfile(),
    getTranslations({ locale, namespace: "events" })
  ]);
  const starts = formatEventDate(event.event_date, locale);
  const ends = formatEventDate(event.end_date, locale);
  const labels = {
    register: t("register"), phone: t("phone"), message: t("message"),
    registrationSuccessful: t("registrationSuccessful"),
    alreadyRegistered: t("alreadyRegistered"), registrationClosed: t("registrationClosed"),
    eventFull: t("eventFull"), invalidPhone: t("invalidPhone"),
    registrationFailed: t("registrationFailed"), sessionExpired: t("sessionExpired")
  };

  return (
    <article className={styles.page} data-tone="cyan">
      <header className={styles.hero}>
        <Container>
          <Link className={styles.backLink} href={localizedPath(locale, "/events")}>
            <ArrowLeft size={18} aria-hidden="true" />
            {localize(eventDetailCopy.back, locale)}
          </Link>
          <p className={styles.eventType}>{event.format || t("event")}</p>
          <h1>{event.title}</h1>
          {event.short_description ? <p className={styles.lead}>{event.short_description}</p> : null}
          {event.image_url ? <div aria-label={event.title} className={styles.eventImage} role="img" style={{ backgroundImage: `url(${JSON.stringify(event.image_url)})` }} /> : null}
          <dl className={styles.heroMeta}>
            <div>
              <dt><CalendarDays size={18} aria-hidden="true" />{localize(eventDetailCopy.date, locale)}</dt>
              <dd><time dateTime={event.event_date}>{starts}</time>{ends ? ` – ${ends}` : null}</dd>
            </div>
            <div>
              <dt><MapPin size={18} aria-hidden="true" />{localize(eventDetailCopy.location, locale)}</dt>
              <dd>{event.location || t("locationPending")}</dd>
            </div>
            <div>
              <dt><Ticket size={18} aria-hidden="true" />{localize(eventDetailCopy.type, locale)}</dt>
              <dd>{event.format || t("event")}</dd>
            </div>
            {event.capacity !== null ? <div><dt><Users size={18} aria-hidden="true" />{t("capacity")}</dt><dd>{event.capacity}</dd></div> : null}
          </dl>
        </Container>
      </header>
      <section className={styles.overview} aria-labelledby="event-overview-heading">
        <Container className={styles.splitSection}>
          <div className={styles.sectionHeading}><p>01</p><h2 id="event-overview-heading">{localize(eventDetailCopy.overview, locale)}</h2></div>
          <p className={styles.overviewText}>{event.description || event.short_description}</p>
        </Container>
      </section>
      <section className={styles.section} id="registration" aria-labelledby="event-registration-heading">
        <Container>
          <div className={styles.sectionHeading}><p>02</p><h2 id="event-registration-heading">{t("registerForEvent")}</h2></div>
          <EventRegistrationForm labels={labels} locale={locale} registrationOpen={event.registration_open} slug={event.slug} user={user} />
        </Container>
      </section>
    </article>
  );
}
