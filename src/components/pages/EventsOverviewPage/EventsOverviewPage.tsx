import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { eventsPageCopy } from "@/data/featured-events";
import type { Locale } from "@/i18n/routing";
import { localize, localizedPath } from "@/lib/utilities/localize";
import { getPublishedEvents } from "@/lib/directus/events";
import styles from "./EventsOverviewPage.module.css";

function eventDate(value: string, locale: Locale) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

export async function EventsOverviewPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const [result, t] = await Promise.all([
    getPublishedEvents(),
    getTranslations({ locale, namespace: "events" })
  ]);

  return (
    <>
      <section className={styles.hero}>
        <Container>
          <p className={styles.eyebrow}>{localize(eventsPageCopy.eyebrow, locale)}</p>
          <h1>{localize(eventsPageCopy.title, locale)}</h1>
          <p className={styles.heroDescription}>{localize(eventsPageCopy.description, locale)}</p>
        </Container>
      </section>

      <section className={styles.eventsSection} aria-labelledby="events-list-heading">
        <Container>
          <header className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{localize(eventsPageCopy.listingEyebrow, locale)}</p>
            <h2 id="events-list-heading">{localize(eventsPageCopy.listingTitle, locale)}</h2>
          </header>

          {!result.ok ? (
            <p className={styles.stateMessage} role="alert">{t("unableToLoadEvents")}</p>
          ) : result.data.length === 0 ? (
            <p className={styles.stateMessage}>{t("noEvents")}</p>
          ) : (
          <div className={styles.eventGrid}>
            {result.data.map((event, index) => (
              <article
                className={styles.eventCard}
                data-tone={index % 2 === 0 ? "cyan" : "gold"}
                id={event.slug}
                key={event.slug}
              >
                <div className={styles.cardTopline}>
                  <span className={styles.eventType}>{event.format || t("event")}</span>
                  <span className={styles.eventDate}>
                    <CalendarDays size={17} aria-hidden="true" />
                    <time dateTime={event.event_date}>{eventDate(event.event_date, locale)}</time>
                  </span>
                </div>

                <div className={styles.cardContent}>
                  {event.image_url ? (
                    <div
                      aria-label={event.title}
                      className={styles.eventImage}
                      role="img"
                      style={{ backgroundImage: `url(${JSON.stringify(event.image_url)})` }}
                    />
                  ) : null}
                  <h3>{event.title}</h3>
                  <p>{event.short_description}</p>
                </div>

                <footer className={styles.cardFooter}>
                  <span className={styles.location}>
                    <MapPin size={18} aria-hidden="true" />
                    {event.location || event.format || t("locationPending")}
                  </span>
                  <Link
                    className={styles.detailsLink}
                    href={localizedPath(locale, `/events/${event.slug}`)}
                  >
                    {localize(eventsPageCopy.details, locale)}
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                </footer>
              </article>
            ))}
          </div>
          )}
        </Container>
      </section>
    </>
  );
}
