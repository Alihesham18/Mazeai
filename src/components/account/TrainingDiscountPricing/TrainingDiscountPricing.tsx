"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import type { Locale } from "@/i18n/routing";
import {
  applyTrainingDiscountAction,
  quoteTrainingDiscountAction
} from "@/lib/discounts/training-actions";
import { initialTrainingDiscountState } from "@/lib/discounts/training-state";
import type {
  AvailableTrainingDiscount,
  TrainingDiscountOverview
} from "@/lib/directus/training-discounts";
import styles from "./TrainingDiscountPricing.module.css";

function SubmitButton({ idle, pending }: { idle: string; pending: string }) {
  const status = useFormStatus();
  return <button disabled={status.pending}>{status.pending ? pending : idle}</button>;
}

function formatMoney(value: number | string, currency: string | null, locale: Locale) {
  const numeric = Number(value);
  if (!currency || !/^[A-Z]{3}$/.test(currency) || !Number.isFinite(numeric)) {
    return `${value}${currency ? ` ${currency}` : ""}`;
  }
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(numeric);
}

function optionLabel(discount: AvailableTrainingDiscount, off: string) {
  const value = discount.discountType === "percentage"
    ? `${discount.discountValue}%`
    : `${discount.discountValue} ${discount.currency}`;
  return `${discount.code} — ${value} ${off}`;
}

export function TrainingDiscountPricing({
  locale,
  applicationId,
  originalFee,
  currency,
  overview,
  unavailable = false
}: {
  locale: Locale;
  applicationId: string;
  originalFee: number | string;
  currency: string | null;
  overview: TrainingDiscountOverview;
  unavailable?: boolean;
}) {
  const t = useTranslations("auth.trainingDiscounts");
  const router = useRouter();
  const [selected, setSelected] = useState(overview.available[0]?.redemptionId ?? "");
  const [quoteState, quoteAction] = useFormState(
    quoteTrainingDiscountAction.bind(null, locale),
    initialTrainingDiscountState
  );
  const [applyState, applyAction] = useFormState(
    applyTrainingDiscountAction.bind(null, locale),
    initialTrainingDiscountState
  );

  useEffect(() => {
    if (applyState.status === "applied") router.refresh();
  }, [applyState.status, router]);

  const applied = applyState.status === "applied" && applyState.quote
    ? {
        redemptionId: applyState.quote.redemptionId,
        code: applyState.quote.discountCode,
        title: applyState.quote.discountTitle,
        originalAmount: applyState.quote.originalAmount,
        discountAmount: applyState.quote.discountAmount,
        finalAmount: applyState.quote.finalAmount,
        currency: applyState.quote.currency
      }
    : overview.applied;
  const quote =
    quoteState.status === "quoted" && quoteState.quote?.redemptionId === selected
      ? quoteState.quote
      : null;

  return (
    <section className={styles.pricing} aria-label={t("pricing")}>
      <div className={styles.row}>
        <span>{t("originalFee")}</span>
        <strong dir="ltr">
          {formatMoney(applied?.originalAmount ?? originalFee, applied?.currency ?? currency, locale)}
        </strong>
      </div>

      {applied ? (
        <div className={styles.applied}>
          <strong>{t("discountApplied")}</strong>
          {applied.code ? <span dir="ltr">{applied.code}</span> : null}
          <div className={styles.row}>
            <span>{t("discountAmount")}</span>
            <strong dir="ltr">-{formatMoney(applied.discountAmount, applied.currency, locale)}</strong>
          </div>
          <div className={[styles.row, styles.total].join(" ")}>
            <span>{t("finalFee")}</span>
            <strong dir="ltr">{formatMoney(applied.finalAmount, applied.currency, locale)}</strong>
          </div>
        </div>
      ) : unavailable ? (
        <p className={styles.error} role="alert">{t("discountUnavailable")}</p>
      ) : overview.available.length === 0 ? (
        <div className={styles.quote}>
          <div className={styles.row}>
            <span>{t("availableDiscounts")}</span>
            <strong className={styles.empty}>{t("noApplicableDiscounts")}</strong>
          </div>
          <div className={styles.row}>
            <span>{t("discountAmount")}</span>
            <strong dir="ltr">{formatMoney(0, currency, locale)}</strong>
          </div>
          <div className={[styles.row, styles.total].join(" ")}>
            <span>{t("finalFee")}</span>
            <strong dir="ltr">{formatMoney(originalFee, currency, locale)}</strong>
          </div>
        </div>
      ) : (
        <>
          <form className={styles.form} action={quoteAction}>
            <input type="hidden" name="applicationId" value={applicationId} />
            <label htmlFor={`discount-${applicationId}`}>{t("availableDiscounts")}</label>
            <select
              id={`discount-${applicationId}`}
              name="redemptionId"
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
            >
              {overview.available.map((discount) => (
                <option key={discount.redemptionId} value={discount.redemptionId}>
                  {optionLabel(discount, t("off"))}
                </option>
              ))}
            </select>
            <SubmitButton idle={t("previewDiscount")} pending={t("calculatingDiscount")} />
          </form>

          {quoteState.message ? (
            <p className={styles.error} role="alert">{t(`messages.${quoteState.message}`)}</p>
          ) : null}

          {quote ? (
            <div className={styles.quote}>
              <p dir="ltr">{optionLabel({
                redemptionId: quote.redemptionId,
                code: quote.discountCode,
                title: quote.discountTitle,
                discountType: quote.discountType,
                discountValue: quote.discountValue,
                currency: quote.currency
              }, t("off"))}</p>
              <div className={styles.row}>
                <span>{t("discountAmount")}</span>
                <strong dir="ltr">-{formatMoney(quote.discountAmount, quote.currency, locale)}</strong>
              </div>
              <div className={[styles.row, styles.total].join(" ")}>
                <span>{t("finalFee")}</span>
                <strong dir="ltr">{formatMoney(quote.finalAmount, quote.currency, locale)}</strong>
              </div>
              <form action={applyAction}>
                <input type="hidden" name="applicationId" value={quote.applicationId} />
                <input type="hidden" name="redemptionId" value={quote.redemptionId} />
                <SubmitButton idle={t("applyDiscount")} pending={t("applyingDiscount")} />
              </form>
            </div>
          ) : null}

          {applyState.message ? (
            <p
              className={applyState.status === "applied" ? styles.success : styles.error}
              role={applyState.status === "applied" ? "status" : "alert"}
            >
              {t(`messages.${applyState.message}`)}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
