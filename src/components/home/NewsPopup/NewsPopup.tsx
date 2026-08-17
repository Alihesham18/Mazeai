"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ImageIcon,
  X
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useState
} from "react";
import { createPortal } from "react-dom";

import type {
  Locale
} from "@/i18n/routing";
import type { DirectusEvent } from "@/lib/directus/types";

import {
  localizedPath
} from "@/lib/utilities/localize";

import styles from "./NewsPopup.module.css";

export function NewsPopup({
  event,
  locale
}: {
  event: DirectusEvent | null;
  locale: Locale;
}) {
  const t = useTranslations("home");

  const [isMounted, setIsMounted] =
    useState(false);

  const [isVisible, setIsVisible] =
    useState(false);

  const [isDismissed, setIsDismissed] =
    useState(false);

  const storageKey = event
    ? `synergymazeai-news-dismissed:${event.slug}`
    : "";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!event || !isMounted) {
      return;
    }

    try {
      const dismissed =
        window.sessionStorage.getItem(
          storageKey
        ) === "true";

      if (dismissed) {
        setIsDismissed(true);
        return;
      }
    } catch {
      // sessionStorage may not be available.
    }

    /*
      Give the visitor time to see the hero first.
    */
    const timer =
      window.setTimeout(() => {
        setIsVisible(true);
      }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    event,
    storageKey,
    isMounted
  ]);

  if (
    !event ||
    !isMounted ||
    isDismissed
  ) {
    return null;
  }

  const eventPath =
    localizedPath(
      locale,
      `/events/${event.slug}`
    );

  function dismiss() {
    setIsVisible(false);
    setIsDismissed(true);

    try {
      window.sessionStorage.setItem(
        storageKey,
        "true"
      );
    } catch {
      // Still dismiss this render.
    }
  }

  const popup = (
    <aside
      className={`${styles.popup} ${
        isVisible
          ? styles.visible
          : ""
      }`}
      aria-label={`${t(
        "newsEyebrow"
      )}: ${event.title}`}
      aria-hidden={!isVisible}
    >
      <Link
        href={eventPath}
        className={
          styles.stretchedLink
        }
        aria-label={`${t(
          "newsCta"
        )}: ${event.title}`}
      />

      <button
        className={
          styles.closeButton
        }
        type="button"
        onClick={(clickEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();

          dismiss();
        }}
        aria-label={t(
          "newsClose"
        )}
      >
        <X
          size={17}
          aria-hidden="true"
        />
      </button>

      <p
        className={
          styles.eyebrow
        }
      >
        {t("newsEyebrow")}
      </p>

      <div
        className={
          styles.imageArea
        }
      >
        {event.image_url ? (
          <span
            aria-label={event.title}
            className={styles.eventImage}
            role="img"
            style={{ backgroundImage: `url(${JSON.stringify(event.image_url)})` }}
          />
        ) : (
          <ImageIcon
            size={19}
            aria-hidden="true"
          />
        )}
      </div>

      <span
        className={
          styles.badge
        }
      >
        Past Event
      </span>

      <h2>
        {event.title}
      </h2>

      <p
        className={
          styles.description
        }
      >
        {event.short_description}
      </p>

      <div
        className={
          styles.meta
        }
      >
        <CalendarDays
          size={14}
          aria-hidden="true"
        />

        <time
          dateTime={
            event.event_date
          }
        >
          {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
            new Date(event.event_date)
          )}
        </time>
      </div>

      <span
        className={
          styles.cta
        }
      >
        <span>
          {t("newsCta")}
        </span>

        <ArrowRight
          size={15}
          aria-hidden="true"
        />
      </span>
    </aside>
  );

  return createPortal(
    popup,
    document.body
  );
}
