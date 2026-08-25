import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  Radio,
  Ticket
} from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { TechnicalDetail, TechnicalLabel } from "@/components/ui/TechnicalDetail";
import type { Locale } from "@/i18n/routing";
import { getPublishedEvents } from "@/lib/directus/events";
import type { DirectusEvent } from "@/lib/directus/types";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./EventsOverviewPage.module.css";

function timestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function eventDate(value: string, locale: Locale) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short" }).format(parsed);
}

function datePart(value: string, locale: Locale, part: "day" | "month" | "year") {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return part === "day" ? "--" : "";

  const options: Intl.DateTimeFormatOptions = part === "day"
    ? { day: "2-digit" }
    : part === "month"
      ? { month: "short" }
      : { year: "numeric" };

  return new Intl.DateTimeFormat(locale, options).format(parsed);
}

function eventTime(value: string, locale: Locale) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(parsed);
}

function DateBlock({ event, locale }: { event: DirectusEvent; locale: Locale }) {
  return (
    <time className={styles.dateBlock} dateTime={event.event_date}>
      <span className={styles.visuallyHidden}>{eventDate(event.event_date, locale)}</span>
      <span aria-hidden="true" className={styles.dateDay}>{datePart(event.event_date, locale, "day")}</span>
      <span aria-hidden="true" className={styles.dateMonth}>{datePart(event.event_date, locale, "month")}</span>
      <span aria-hidden="true" className={styles.dateYear}>{datePart(event.event_date, locale, "year")}</span>
    </time>
  );
}

function EventConsole({ label }: { label: string }) {
  return (
    <div className={styles.console} role="img" aria-label={label}>
      <TechnicalDetail variant="grid" className={styles.consoleGrid} />
      <div className={styles.consoleTop} aria-hidden="true">
        <span>EVT / INDEX</span>
        <span className={styles.consoleSignal}><Radio size={13} /> LIVE</span>
      </div>
      <div className={styles.consoleDisplay} aria-hidden="true">
        <CalendarDays size={38} strokeWidth={1.25} />
        <div className={styles.signalTracks}>
          <span /><span /><span /><span />
        </div>
      </div>
      <div className={styles.consoleFooter} aria-hidden="true">
        <span>PROGRAM</span><span>SCHEDULE</span><span>ARCHIVE</span>
      </div>
    </div>
  );
}

function EventMeta({ event, locale, labels }: {
  event: DirectusEvent;
  locale: Locale;
  labels: { date: string; location: string; format: string };
}) {
  return (
    <dl className={styles.eventMeta}>
      <div>
        <dt><Clock3 size={14} aria-hidden="true" />{labels.date}</dt>
        <dd><time dateTime={event.event_date}>{eventTime(event.event_date, locale)}</time></dd>
      </div>
      {event.location ? (
        <div>
          <dt><MapPin size={14} aria-hidden="true" />{labels.location}</dt>
          <dd>{event.location}</dd>
        </div>
      ) : null}
      {event.format ? (
        <div>
          <dt><Radio size={14} aria-hidden="true" />{labels.format}</dt>
          <dd>{event.format}</dd>
        </div>
      ) : null}
    </dl>
  );
}

export async function EventsOverviewPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [result, t] = await Promise.all([
    getPublishedEvents(),
    getTranslations({ locale, namespace: "events" })
  ]);

  const now = Date.now();
  const events = result.ok ? result.data : [];
  const upcomingEvents = events
    .filter((event) => (timestamp(event.event_date) ?? Number.NEGATIVE_INFINITY) >= now)
    .sort((a, b) => (timestamp(a.event_date) ?? 0) - (timestamp(b.event_date) ?? 0));
  const pastEvents = events
    .filter((event) => (timestamp(event.event_date) ?? Number.POSITIVE_INFINITY) < now)
    .sort((a, b) => (timestamp(b.event_date) ?? 0) - (timestamp(a.event_date) ?? 0));
  const featuredEvent = upcomingEvents[0];
  const scheduledEvents = upcomingEvents.slice(1);
  const metaLabels = {
    date: t("overview.meta.time"),
    location: t("overview.meta.location"),
    format: t("overview.meta.format")
  };

  return (
    <div className={styles.page}>
      <header className={styles.programHeader}>
        <TechnicalDetail variant="grid" className={styles.headerGrid} />
        <Container className={styles.headerLayout}>
          <div className={styles.headerCopy}>
            <TechnicalLabel index="EVT.01">{t("overview.header.overline")}</TechnicalLabel>
            <h1>{t("overview.header.title")}</h1>
            <p>{t("overview.header.description")}</p>
            <TechnicalDetail variant="circuit" className={styles.headerCircuit} />
          </div>
          <EventConsole label={t("overview.header.consoleLabel")} />
        </Container>
      </header>

      {!result.ok ? (
        <section className={styles.stateSection} aria-labelledby="events-state-heading">
          <Container>
            <div className={styles.statePanel} role="alert">
              <TechnicalLabel index="ERR">{t("overview.programLabel")}</TechnicalLabel>
              <h2 id="events-state-heading">{t("overview.errorTitle")}</h2>
              <p>{t("unableToLoadEvents")}</p>
            </div>
          </Container>
        </section>
      ) : featuredEvent ? (
        <section className={styles.featuredSection} aria-labelledby="featured-event-heading">
          <Container>
            <div className={styles.sectionIntro}>
              <TechnicalLabel index="01">{t("overview.featured.overline")}</TechnicalLabel>
              <p>{t("overview.featured.description")}</p>
            </div>

            <article className={styles.featuredEvent} id={featuredEvent.slug}>
              <TechnicalDetail variant="mazeCorner" className={styles.featuredCorner} />
              <DateBlock event={featuredEvent} locale={locale} />
              <div className={styles.featuredContent}>
                <span className={styles.status}>{t("overview.featured.status")}</span>
                <h2 id="featured-event-heading">{featuredEvent.title}</h2>
                {featuredEvent.short_description ? <p>{featuredEvent.short_description}</p> : null}
                <div className={styles.featuredActions}>
                  <Button
                    href={localizedPath(locale, `/events/${featuredEvent.slug}`)}
                    aria-label={t("overview.actions.viewNamed", { title: featuredEvent.title })}
                  >
                    {t("overview.actions.view")}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Button>
                  {featuredEvent.registration_open ? (
                    <Button
                      variant="outline"
                      href={`${localizedPath(locale, `/events/${featuredEvent.slug}`)}#registration`}
                      aria-label={t("overview.actions.registerNamed", { title: featuredEvent.title })}
                    >
                      <Ticket size={16} aria-hidden="true" />
                      {t("register")}
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className={styles.featuredAside}>
                {featuredEvent.image_url ? (
                  <div
                    aria-label={featuredEvent.title}
                    className={styles.featuredImage}
                    role="img"
                    style={{ backgroundImage: `url(${JSON.stringify(featuredEvent.image_url)})` }}
                  />
                ) : (
                  <div className={styles.eventSignal} aria-hidden="true">
                    <span className={styles.signalCore}><CalendarDays size={27} /></span>
                    <i /><i /><i />
                  </div>
                )}
                <EventMeta event={featuredEvent} locale={locale} labels={metaLabels} />
              </div>
            </article>
          </Container>
        </section>
      ) : (
        <section className={styles.stateSection} aria-labelledby="events-state-heading">
          <Container>
            <div className={styles.statePanel}>
              <TechnicalLabel index="00">{t("overview.programLabel")}</TechnicalLabel>
              <h2 id="events-state-heading">{t("overview.emptyTitle")}</h2>
              <p>{t("overview.emptyDescription")}</p>
            </div>
          </Container>
        </section>
      )}

      {scheduledEvents.length > 0 ? (
        <section className={styles.scheduleSection} aria-labelledby="upcoming-events-heading">
          <Container>
            <div className={styles.scheduleHeading}>
              <div>
                <TechnicalLabel index="02">{t("overview.upcoming.overline")}</TechnicalLabel>
                <h2 id="upcoming-events-heading">{t("overview.upcoming.title")}</h2>
              </div>
              <TechnicalDetail variant="line" />
            </div>
            <div className={styles.scheduleList}>
              {scheduledEvents.map((event) => (
                <article className={styles.scheduleEvent} id={event.slug} key={event.slug}>
                  <DateBlock event={event} locale={locale} />
                  <div className={styles.scheduleContent}>
                    <span className={styles.eventIndex}>{event.format || t("event")}</span>
                    <h3>{event.title}</h3>
                    {event.short_description ? <p>{event.short_description}</p> : null}
                  </div>
                  <EventMeta event={event} locale={locale} labels={metaLabels} />
                  <div className={styles.scheduleActions}>
                    <Link
                      className={styles.eventLink}
                      href={localizedPath(locale, `/events/${event.slug}`)}
                      aria-label={t("overview.actions.viewNamed", { title: event.title })}
                    >
                      {t("overview.actions.view")}<ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                    {event.registration_open ? (
                      <Link
                        className={styles.registerLink}
                        href={`${localizedPath(locale, `/events/${event.slug}`)}#registration`}
                        aria-label={t("overview.actions.registerNamed", { title: event.title })}
                      >
                        {t("register")}
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {pastEvents.length > 0 ? (
        <section className={styles.archiveSection} aria-labelledby="past-events-heading">
          <Container>
            <div className={styles.archiveHeading}>
              <TechnicalLabel index="03">{t("overview.archive.overline")}</TechnicalLabel>
              <h2 id="past-events-heading">{t("overview.archive.title")}</h2>
              <p>{t("overview.archive.description")}</p>
            </div>
            <div className={styles.archiveList}>
              {pastEvents.map((event) => (
                <article className={styles.archiveEvent} key={event.slug}>
                  <time dateTime={event.event_date}>{eventDate(event.event_date, locale)}</time>
                  <div>
                    <span>{event.format || t("event")}</span>
                    <h3>{event.title}</h3>
                  </div>
                  {event.location ? <p><MapPin size={14} aria-hidden="true" />{event.location}</p> : <span />}
                  <Link
                    href={localizedPath(locale, `/events/${event.slug}`)}
                    aria-label={t("overview.actions.viewNamed", { title: event.title })}
                  >
                    {t("overview.actions.view")}<ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className={styles.ctaSection} aria-labelledby="events-cta-heading">
        <Container>
          <div className={styles.ctaPanel}>
            <TechnicalDetail variant="dots" className={styles.ctaDots} />
            <div>
              <TechnicalLabel index="04">{t("overview.cta.overline")}</TechnicalLabel>
              <h2 id="events-cta-heading">{t("overview.cta.title")}</h2>
              <p>{t("overview.cta.description")}</p>
            </div>
            <Button href={localizedPath(locale, "/contact")} variant="outline">
              {t("overview.cta.action")}<ArrowUpRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
