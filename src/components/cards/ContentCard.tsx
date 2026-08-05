import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Locale } from "@/i18n/routing";
import { localizedPath, localize } from "@/lib/utilities/localize";
import type { CardContent, EventContent } from "@/types/content";
import styles from "./ContentCard.module.css";

interface ContentCardProps {
  item: CardContent;
  locale: Locale;
  href: string;
  ctaLabel: string;
}

export function ContentCard({ item, locale, href, ctaLabel }: ContentCardProps) {
  return (
    <Card interactive className={styles.card}>
      {item.eyebrow ? <p className={styles.eyebrow}>{localize(item.eyebrow, locale)}</p> : null}
      <h3 className={styles.title}>{localize(item.title, locale)}</h3>
      <p className={styles.description}>{localize(item.description, locale)}</p>
      <Button href={localizedPath(locale, href)} variant="ghost">
        {ctaLabel}
        <ArrowUpRight size={16} aria-hidden="true" />
      </Button>
    </Card>
  );
}

export function EventCard({
  item,
  locale,
  ctaLabel
}: {
  item: EventContent;
  locale: Locale;
  ctaLabel: string;
}) {
  return (
    <Card interactive className={styles.card}>
      <Badge>{localize(item.type, locale)}</Badge>
      <h3 className={styles.title}>{localize(item.title, locale)}</h3>
      <p className={styles.description}>{localize(item.description, locale)}</p>
      <p className={styles.meta}>
        <time dateTime={item.date}>{item.date}</time> · {localize(item.format, locale)} ·{" "}
        {localize(item.location, locale)}
      </p>
      <Button href={localizedPath(locale, `/events/${item.slug}/register`)} variant="secondary">
        {ctaLabel}
      </Button>
    </Card>
  );
}
