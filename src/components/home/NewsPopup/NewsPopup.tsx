"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, ImageIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { getLatestCompletedEvent } from "@/data/featured-events";
import type { Locale } from "@/i18n/routing";
import { localizedPath, localize } from "@/lib/utilities/localize";

import styles from "./NewsPopup.module.css";

export function NewsPopup({ locale }: { locale: Locale }) {
  const t = useTranslations("home");

  const event = useMemo(() => getLatestCompletedEvent(), []);

  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const storageKey = event
    ? `synergymazeai-news-dismissed:${event.slug}`
    : "";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!event || !isMounted) return;

    try {
      const dismissed =
        window.sessionStorage.getItem(storageKey) === "true";

      if (dismissed) {
        setIsDismissed(true);
        return;
      }
    } catch {
      // sessionStorage may be unavailable.
    }

    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [event, storageKey, isMounted]);

  if (!event || !isMounted || isDismissed) {
    return null;
  }

  const eventPath = localizedPath(
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
      // Still dismiss if storage is unavailable.
    }
  }

  const popup = (
    <aside
      className={`${styles.popup} ${
        isVisible ? styles.visible : ""
      }`}
      aria-label={`${t("newsEyebrow")}: ${event.title}`}
      aria-hidden={!isVisible}
    >
      <Link
        href={eventPath}
        className={styles.stretchedLink}
        aria-label={`${t("newsCta")}: ${event.title}`}
      />

      <button
        className={styles.closeButton}
        type="button"
        onClick={(clickEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          dismiss();
        }}
        aria-label={t("newsClose")}
      >
        <X
          size={17}
          aria-hidden="true"
        />
      </button>

      <p className={styles.eyebrow}>
        {t("newsEyebrow")}
      </p>

      <div className={styles.imageArea}>
        {event.eventImage ? (
          <Image
            src={event.eventImage}
            alt={event.title}
            fill
            sizes="380px"
            className={styles.eventImage}
          />
        ) : (
          <ImageIcon
            size={20}
            aria-hidden="true"
          />
        )}
      </div>

      <h2>
        {event.title}
      </h2>

      <p className={styles.description}>
        {localize(
          event.description,
          locale
        )}
      </p>

      <div className={styles.meta}>
        <CalendarDays
          size={15}
          aria-hidden="true"
        />

        <time dateTime={event.dateTime}>
          {localize(
            event.date,
            locale
          )}
        </time>
      </div>

      <span className={styles.cta}>
        {t("newsCta")}

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