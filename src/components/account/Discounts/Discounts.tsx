"use client";

import { useEffect, useRef } from "react";
import { BadgePercent, CalendarClock, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormState, useFormStatus } from "react-dom";
import type { Locale } from "@/i18n/routing";
import { redeemDiscountAction } from "@/lib/discounts/actions";
import { initialDiscountActionState } from "@/lib/discounts/state";
import type { AccountDiscount } from "@/lib/directus/discounts";
import styles from "./Discounts.module.css";

function RedeemButton() {
  const t = useTranslations("auth.discounts");
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? t("redeeming") : t("redeem")}
    </button>
  );
}

function formatValue(discount: AccountDiscount, locale: Locale, offLabel: string) {
  const value = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
    discount.discountValue
  );
  return discount.discountType === "percentage"
    ? `${value}% ${offLabel}`
    : `${value} ${discount.currency} ${offLabel}`;
}

export function Discounts({
  locale,
  discounts,
  unavailable = false
}: {
  locale: Locale;
  discounts: AccountDiscount[];
  unavailable?: boolean;
}) {
  const t = useTranslations("auth.discounts");
  const [state, formAction] = useFormState(
    redeemDiscountAction.bind(null, locale),
    initialDiscountActionState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <section className={styles.card} aria-labelledby="discounts-heading">
      <div className={styles.heading}>
        <span aria-hidden="true"><BadgePercent size={22} /></span>
        <div>
          <h2 id="discounts-heading">{t("title")}</h2>
          <p>{t("support")}</p>
        </div>
      </div>

      <form ref={formRef} className={styles.form} action={formAction}>
        <label htmlFor="discount-code">{t("inputLabel")}</label>
        <div className={styles.controls}>
          <input
            id="discount-code"
            name="code"
            autoComplete="off"
            maxLength={128}
            placeholder={t("placeholder")}
            required
          />
          <RedeemButton />
        </div>
        {state.message ? (
          <p
            className={state.status === "error" ? styles.error : styles.success}
            role={state.status === "error" ? "alert" : "status"}
          >
            {t(`messages.${state.message}`)}
          </p>
        ) : null}
      </form>

      <div className={styles.listHeading}>
        <h3>{t("myDiscounts")}</h3>
        {!unavailable ? <span>{discounts.length}</span> : null}
      </div>

      {unavailable ? (
        <p className={styles.loadError} role="alert">{t("unavailable")}</p>
      ) : discounts.length === 0 ? (
        <div className={styles.empty}>
          <Tag size={24} aria-hidden="true" />
          <strong>{t("emptyTitle")}</strong>
          <p>{t("emptySupport")}</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {discounts.map((discount) => (
            <li key={discount.id}>
              <div className={styles.discountTopline}>
                <div>
                  <code dir="ltr">{discount.code}</code>
                  <strong dir="ltr">{formatValue(discount, locale, t("off"))}</strong>
                </div>
                <span className={styles[discount.displayStatus]}>
                  {t(`statuses.${discount.displayStatus}`)}
                </span>
              </div>
              {discount.title ? <h4>{discount.title}</h4> : null}
              {discount.description ? <p>{discount.description}</p> : null}
              <dl>
                <div>
                  <dt>{t("typeLabel")}</dt>
                  <dd>{t(`types.${discount.discountType}`)}</dd>
                </div>
                <div>
                  <dt>{t("appliesToLabel")}</dt>
                  <dd>{t(`appliesTo.${discount.appliesTo}`)}</dd>
                </div>
                {discount.expiresAt ? (
                  <div>
                    <dt><CalendarClock size={14} aria-hidden="true" />{t("expiresLabel")}</dt>
                    <dd>
                      {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                        new Date(discount.expiresAt)
                      )}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
