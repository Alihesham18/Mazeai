import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Ticket } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { eventDetailCopy, type FeaturedEvent } from "@/data/featured-events";
import type { Locale } from "@/i18n/routing";
import { localize, localizedPath } from "@/lib/utilities/localize";
import styles from "./EventDetailPage.module.css";

interface EventDetailPageProps {
  event: FeaturedEvent;
  locale: Locale;
}

export function EventDetailPage({ event, locale }: EventDetailPageProps) {
  setRequestLocale(locale);

  return (
    <article className={styles.page} data-tone={event.tone}>
      <header className={styles.hero}>
        <Container>
          <Link className={styles.backLink} href={localizedPath(locale, "/events")}>
            <ArrowLeft size={18} aria-hidden="true" />
            {localize(eventDetailCopy.back, locale)}
          </Link>
          <p className={styles.eventType}>{localize(event.type, locale)}</p>
          <h1>{event.title}</h1>
          <p className={styles.lead}>{localize(event.description, locale)}</p>

          <dl className={styles.heroMeta}>
            <div>
              <dt>
                <CalendarDays size={18} aria-hidden="true" />
                {localize(eventDetailCopy.date, locale)}
              </dt>
              <dd>
                {event.dateTime ? (
                  <time dateTime={event.dateTime}>{localize(event.date, locale)}</time>
                ) : (
                  localize(event.date, locale)
                )}
              </dd>
            </div>
            <div>
              <dt>
                <MapPin size={18} aria-hidden="true" />
                {localize(eventDetailCopy.location, locale)}
              </dt>
              <dd>{localize(event.location, locale)}</dd>
            </div>
            <div>
              <dt>
                <Ticket size={18} aria-hidden="true" />
                {localize(eventDetailCopy.type, locale)}
              </dt>
              <dd>{localize(event.type, locale)}</dd>
            </div>
          </dl>
        </Container>
      </header>

      <section className={styles.overview} aria-labelledby="event-overview-heading">
        <Container className={styles.splitSection}>
          <div className={styles.sectionHeading}>
            <p>01</p>
            <h2 id="event-overview-heading">{localize(eventDetailCopy.overview, locale)}</h2>
          </div>
          <p className={styles.overviewText}>{localize(event.overview, locale)}</p>
        </Container>
      </section>

      <section className={styles.section} aria-labelledby="event-program-heading">
        <Container>
          <div className={styles.sectionHeading}>
            <p>02</p>
            <h2 id="event-program-heading">{localize(eventDetailCopy.program, locale)}</h2>
          </div>
          <ol className={styles.programList}>
            {event.program.map((item, index) => (
              <li key={item.en}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <strong>{localize(item, locale)}</strong>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className={styles.section} aria-labelledby="event-audience-heading">
        <Container className={styles.audienceGrid}>
          <div className={styles.sectionHeading}>
            <p>03</p>
            <h2 id="event-audience-heading">{localize(eventDetailCopy.audience, locale)}</h2>
          </div>
          <ul className={styles.audienceList}>
            {event.audience.map((item) => (
              <li key={item.en}>{localize(item, locale)}</li>
            ))}
          </ul>
        </Container>
      </section>

      <section className={styles.logistics} aria-labelledby="event-logistics-heading">
        <Container>
          <div className={styles.sectionHeading}>
            <p>04</p>
            <h2 id="event-logistics-heading">{localize(eventDetailCopy.logistics, locale)}</h2>
          </div>
          <ul className={styles.logisticsList}>
            {event.formatDetails.map((item) => (
              <li key={item.en}>{localize(item, locale)}</li>
            ))}
          </ul>
          <p className={styles.note}>{localize(eventDetailCopy.note, locale)}</p>
        </Container>
      </section>
    </article>
  );
}
