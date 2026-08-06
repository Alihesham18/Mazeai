import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { eventsPageCopy, featuredEvents } from "@/data/featured-events";
import type { Locale } from "@/i18n/routing";
import { localize, localizedPath } from "@/lib/utilities/localize";
import styles from "./EventsOverviewPage.module.css";

export function EventsOverviewPage({ locale }: { locale: Locale }) {
  setRequestLocale(locale);

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

          <div className={styles.eventGrid}>
            {featuredEvents.map((event) => (
              <article
                className={styles.eventCard}
                data-tone={event.tone}
                id={event.slug}
                key={event.slug}
              >
                <div className={styles.cardTopline}>
                  <span className={styles.eventType}>{localize(event.type, locale)}</span>
                  <span className={styles.eventDate}>
                    <CalendarDays size={17} aria-hidden="true" />
                    {event.dateTime ? (
                      <time dateTime={event.dateTime}>{localize(event.date, locale)}</time>
                    ) : (
                      localize(event.date, locale)
                    )}
                  </span>
                </div>

                <div className={styles.cardContent}>
                  <h3>{event.title}</h3>
                  <p>{localize(event.description, locale)}</p>
                </div>

                <footer className={styles.cardFooter}>
                  <span className={styles.location}>
                    <MapPin size={18} aria-hidden="true" />
                    {localize(event.location, locale)}
                  </span>
                  <a
                    className={styles.detailsLink}
                    href={localizedPath(locale, `/events/${event.slug}`)}
                  >
                    {localize(eventsPageCopy.details, locale)}
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </a>
                </footer>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
