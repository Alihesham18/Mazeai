import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  Radio,
  Ticket,
  Users
} from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EventRegistrationForm } from "@/components/events/EventRegistrationForm";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { TechnicalDetail, TechnicalLabel } from "@/components/ui/TechnicalDetail";
import type { Locale } from "@/i18n/routing";
import { getCurrentUserProfile } from "@/lib/auth/user";
import { getPublishedEvents } from "@/lib/directus/events";
import type { DirectusEvent } from "@/lib/directus/types";
import { getEventTimingStatus, otherEvents } from "@/lib/events/presentation";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./EventDetailPage.module.css";

function parsedDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value: string, locale: Locale) {
  const parsed = parsedDate(value);
  return parsed
    ? new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(parsed)
    : value;
}

function formatDateTime(value: string, locale: Locale) {
  const parsed = parsedDate(value);
  return parsed
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(parsed)
    : value;
}

function formatTime(value: string, locale: Locale) {
  const parsed = parsedDate(value);
  return parsed
    ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(parsed)
    : value;
}

function datePart(value: string, locale: Locale, part: "day" | "month" | "year") {
  const parsed = parsedDate(value);
  if (!parsed) return part === "day" ? "--" : "";
  const options: Intl.DateTimeFormatOptions = part === "day"
    ? { day: "2-digit" }
    : part === "month"
      ? { month: "short" }
      : { year: "numeric" };
  return new Intl.DateTimeFormat(locale, options).format(parsed);
}

function localDateKey(value: string, locale: Locale) {
  const parsed = parsedDate(value);
  if (!parsed) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(parsed);
}

function EventTimeRange({ event, locale }: { event: DirectusEvent; locale: Locale }) {
  if (!event.end_date) {
    return <time dateTime={event.event_date}>{formatTime(event.event_date, locale)}</time>;
  }

  const sameDate = localDateKey(event.event_date, locale) === localDateKey(event.end_date, locale);
  if (!sameDate) {
    return (
      <>
        <time dateTime={event.event_date}>{formatDateTime(event.event_date, locale)}</time>
        <span aria-hidden="true"> — </span>
        <time dateTime={event.end_date}>{formatDateTime(event.end_date, locale)}</time>
      </>
    );
  }

  return (
    <>
      <time dateTime={event.event_date}>{formatTime(event.event_date, locale)}</time>
      <span aria-hidden="true"> — </span>
      <time dateTime={event.end_date}>{formatTime(event.end_date, locale)}</time>
    </>
  );
}

function EventDateBlock({ event, locale }: { event: DirectusEvent; locale: Locale }) {
  return (
    <time className={styles.dateBlock} dateTime={event.event_date}>
      <span className={styles.visuallyHidden}>{formatDateTime(event.event_date, locale)}</span>
      <span aria-hidden="true" className={styles.dateDay}>{datePart(event.event_date, locale, "day")}</span>
      <span aria-hidden="true" className={styles.dateMonth}>{datePart(event.event_date, locale, "month")}</span>
      <span aria-hidden="true" className={styles.dateYear}>{datePart(event.event_date, locale, "year")}</span>
      <span aria-hidden="true" className={styles.dateTicks}><i /><i /><i /><i /></span>
    </time>
  );
}

function EventProgramVisual({ label }: { label: string }) {
  return (
    <div className={styles.programVisual} role="img" aria-label={label}>
      <TechnicalDetail variant="grid" className={styles.visualGrid} />
      <svg viewBox="0 0 360 170" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor">
          <path d="M24 34h112l18 18h182" />
          <path d="M24 136h72l18-18h222" />
          <path d="M58 68h132M58 85h210M58 102h164" />
          <circle cx="38" cy="85" r="14" />
          <circle cx="190" cy="68" r="4" />
          <circle cx="268" cy="85" r="4" />
          <circle cx="222" cy="102" r="4" />
          <path d="M38 77v9l6 4" />
          <path d="M314 52v66M302 63h24M302 107h24" />
        </g>
      </svg>
    </div>
  );
}

function OtherEventDate({ event, locale }: { event: DirectusEvent; locale: Locale }) {
  return (
    <time dateTime={event.event_date} className={styles.otherDate}>
      <span>{datePart(event.event_date, locale, "day")}</span>
      <span>{datePart(event.event_date, locale, "month")}</span>
      <span>{datePart(event.event_date, locale, "year")}</span>
    </time>
  );
}

export async function EventDetailPage({ event, locale }: { event: DirectusEvent; locale: Locale }) {
  setRequestLocale(locale);
  const [user, t, eventsResult] = await Promise.all([
    getCurrentUserProfile(),
    getTranslations({ locale, namespace: "events" }),
    getPublishedEvents()
  ]);
  const timingStatus = getEventTimingStatus(event);
  const canRegister = event.registration_open && timingStatus === "upcoming";
  const relatedEvents = eventsResult.ok ? otherEvents(eventsResult.data, event) : [];
  const about = event.description || event.short_description;
  const registrationStatus = canRegister
    ? t("detail.registration.open")
    : t("detail.registration.closed");
  const labels = {
    register: t("register"),
    phone: t("phone"),
    message: t("message"),
    registrationSuccessful: t("registrationSuccessful"),
    alreadyRegistered: t("alreadyRegistered"),
    registrationClosed: t("registrationClosed"),
    eventFull: t("eventFull"),
    invalidPhone: t("invalidPhone"),
    registrationFailed: t("registrationFailed"),
    sessionExpired: t("sessionExpired")
  };

  return (
    <div className={styles.page}>
      <article>
        <header className={styles.briefingHeader}>
          <TechnicalDetail variant="grid" className={styles.headerGrid} />
          <Container className={styles.headerContainer}>
            <Link className={styles.backLink} href={localizedPath(locale, "/events")}>
              <ArrowLeft size={16} aria-hidden="true" />
              {t("detail.back")}
            </Link>

            <div className={styles.briefingGrid}>
              <EventDateBlock event={event} locale={locale} />
              <div className={styles.identity}>
                <div className={styles.identityLabels}>
                  <TechnicalLabel index="EVT.02">{event.format || t("detail.header.overline")}</TechnicalLabel>
                  {timingStatus ? (
                    <span className={styles.eventStatus} data-status={timingStatus}>
                      {t(`detail.status.${timingStatus}`)}
                    </span>
                  ) : null}
                </div>
                <h1>{event.title}</h1>
                {event.short_description ? <p>{event.short_description}</p> : null}
              </div>

              <div className={styles.visualFrame}>
                {event.image_url ? (
                  <div
                    aria-label={event.title}
                    className={styles.eventImage}
                    role="img"
                    style={{ backgroundImage: `url(${JSON.stringify(event.image_url)})` }}
                  />
                ) : (
                  <EventProgramVisual label={t("detail.visualAriaLabel", { title: event.title })} />
                )}
              </div>
            </div>

            <dl className={styles.metadataRail}>
              <div>
                <dt><Clock3 size={15} aria-hidden="true" />{t("detail.meta.time")}</dt>
                <dd><EventTimeRange event={event} locale={locale} /></dd>
              </div>
              {event.location ? (
                <div>
                  <dt><MapPin size={15} aria-hidden="true" />{t("detail.meta.location")}</dt>
                  <dd>{event.location}</dd>
                </div>
              ) : null}
              {event.format ? (
                <div>
                  <dt><Radio size={15} aria-hidden="true" />{t("detail.meta.format")}</dt>
                  <dd>{event.format}</dd>
                </div>
              ) : null}
              {event.capacity !== null ? (
                <div>
                  <dt><Users size={15} aria-hidden="true" />{t("detail.meta.capacity")}</dt>
                  <dd>{event.capacity}</dd>
                </div>
              ) : null}
              <div>
                <dt><Ticket size={15} aria-hidden="true" />{t("detail.meta.registration")}</dt>
                <dd>{registrationStatus}</dd>
              </div>
            </dl>
          </Container>
        </header>

        {about ? (
          <section className={styles.aboutSection} aria-labelledby="event-about-heading">
            <Container className={styles.editorialGrid}>
              <header className={styles.sectionHeading}>
                <TechnicalLabel index="01">{t("detail.about.overline")}</TechnicalLabel>
                <h2 id="event-about-heading">{t("detail.about.title")}</h2>
                <TechnicalDetail variant="line" />
              </header>
              <div className={styles.aboutContent}>
                <p>{about}</p>
              </div>
            </Container>
          </section>
        ) : null}

        <section className={styles.registrationSection} id="registration" aria-labelledby="event-registration-heading">
          <Container>
            <div className={styles.sectionHeading}>
              <TechnicalLabel index="02">{t("detail.registration.overline")}</TechnicalLabel>
              <h2 id="event-registration-heading">{t("detail.registration.title")}</h2>
            </div>
            <div className={styles.registrationPanel}>
              <div className={styles.registrationContext}>
                <span className={styles.registrationState} data-open={canRegister}>
                  <i aria-hidden="true" />
                  {registrationStatus}
                </span>
                <h3>{event.title}</h3>
                <p>
                  <CalendarDays size={15} aria-hidden="true" />
                  <time dateTime={event.event_date}>{formatDate(event.event_date, locale)}</time>
                </p>
                <p>
                  <Clock3 size={15} aria-hidden="true" />
                  <EventTimeRange event={event} locale={locale} />
                </p>
                {event.location ? <p><MapPin size={15} aria-hidden="true" />{event.location}</p> : null}
              </div>
              <div className={styles.registrationAction}>
                <EventRegistrationForm
                  labels={labels}
                  locale={locale}
                  registrationOpen={canRegister}
                  slug={event.slug}
                  user={user}
                />
              </div>
            </div>
          </Container>
        </section>
      </article>

      {relatedEvents.length > 0 ? (
        <section className={styles.otherSection} aria-labelledby="other-events-heading">
          <Container>
            <div className={styles.otherHeading}>
              <div>
                <TechnicalLabel index="03">{t("detail.other.overline")}</TechnicalLabel>
                <h2 id="other-events-heading">{t("detail.other.title")}</h2>
              </div>
              <TechnicalDetail variant="circuit" />
            </div>
            <div className={styles.otherList}>
              {relatedEvents.map((relatedEvent) => (
                <article className={styles.otherEvent} key={relatedEvent.slug}>
                  <OtherEventDate event={relatedEvent} locale={locale} />
                  <div>
                    {relatedEvent.format ? <span>{relatedEvent.format}</span> : null}
                    <h3>{relatedEvent.title}</h3>
                    {relatedEvent.location ? <p><MapPin size={14} aria-hidden="true" />{relatedEvent.location}</p> : null}
                  </div>
                  <Link
                    href={localizedPath(locale, `/events/${relatedEvent.slug}`)}
                    aria-label={t("detail.other.viewNamed", { title: relatedEvent.title })}
                  >
                    {t("detail.other.view")}<ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <nav className={styles.closingNav} aria-label={t("detail.closingNavigation")}>
        <Container>
          <Button href={localizedPath(locale, "/events")} variant="text">
            <ArrowLeft size={16} aria-hidden="true" />
            {t("detail.viewAll")}
          </Button>
        </Container>
      </nav>
    </div>
  );
}
