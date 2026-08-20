import { ArrowRight, History, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import type {
  AdminUserActivityAction,
  AdminUserActivityEntry,
  AdminUserActivityResult
} from "@/lib/directus/admin-activity";

import styles from "./AdminActivity.module.css";

const actionKeys: Record<AdminUserActivityAction, string> = {
  "user.suspended": "activity.actions.suspended",
  "user.activated": "activity.actions.activated",
  "user.role_changed": "activity.actions.roleChanged",
  "user.password_reset_requested": "activity.actions.passwordResetRequested"
};

const valueKeys: Record<string, string> = {
  active: "users.statuses.active",
  suspended: "users.statuses.suspended",
  websiteUser: "users.roles.websiteUser",
  websiteAdmin: "users.roles.websiteAdmin"
};

function formattedDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function ActivityChange({
  entry,
  translate
}: {
  entry: AdminUserActivityEntry;
  translate: (key: string) => string;
}) {
  if (!entry.previousValue && !entry.newValue) {
    return <span className={styles.muted}>{translate("activity.noChange")}</span>;
  }

  const previous = entry.previousValue
    ? translate(valueKeys[entry.previousValue] ?? "users.unavailable")
    : translate("users.unavailable");
  const next = entry.newValue
    ? translate(valueKeys[entry.newValue] ?? "users.unavailable")
    : translate("users.unavailable");

  return (
    <span className={styles.change}>
      <span>{previous}</span>
      <ArrowRight size={14} aria-hidden="true" />
      <strong>{next}</strong>
    </span>
  );
}

export async function AdminActivity({
  locale,
  result
}: {
  locale: Locale;
  result: AdminUserActivityResult;
}) {
  const t = await getTranslations({ locale, namespace: "adminAuth" });

  return (
    <div className={styles.activity}>
      <header className={styles.heading}>
        <p>{t("activity.eyebrow")}</p>
        <h1>{t("activity.title")}</h1>
        <span>{t("activity.description")}</span>
      </header>

      {result.state === "unavailable" ? (
        <section className={styles.messagePanel} role="status">
          <History aria-hidden="true" />
          <h2>{t("activity.unavailableTitle")}</h2>
          <p>{t("activity.unavailableMessage")}</p>
        </section>
      ) : result.entries.length === 0 ? (
        <section className={styles.messagePanel}>
          <History aria-hidden="true" />
          <p>{t("activity.noActivity")}</p>
        </section>
      ) : (
        <section className={styles.panel} aria-label={t("activity.title")}>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th scope="col">{t("activity.action")}</th>
                  <th scope="col">{t("activity.administrator")}</th>
                  <th scope="col">{t("activity.target")}</th>
                  <th scope="col">{t("activity.change")}</th>
                  <th scope="col">{t("activity.time")}</th>
                </tr>
              </thead>
              <tbody>
                {result.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <span className={styles.actionLabel}>
                        <ShieldCheck size={16} aria-hidden="true" />
                        {t(actionKeys[entry.action])}
                      </span>
                    </td>
                    <td dir="ltr">{entry.administratorEmail}</td>
                    <td dir="ltr">{entry.targetEmail}</td>
                    <td>
                      <ActivityChange entry={entry} translate={t} />
                    </td>
                    <td>
                      <time dateTime={entry.dateCreated}>
                        {formattedDate(locale, entry.dateCreated)}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileCards}>
            {result.entries.map((entry) => (
              <article key={entry.id}>
                <strong className={styles.actionLabel}>
                  <ShieldCheck size={16} aria-hidden="true" />
                  {t(actionKeys[entry.action])}
                </strong>
                <dl>
                  <div>
                    <dt>{t("activity.administrator")}</dt>
                    <dd dir="ltr">{entry.administratorEmail}</dd>
                  </div>
                  <div>
                    <dt>{t("activity.target")}</dt>
                    <dd dir="ltr">{entry.targetEmail}</dd>
                  </div>
                  <div>
                    <dt>{t("activity.change")}</dt>
                    <dd>
                      <ActivityChange entry={entry} translate={t} />
                    </dd>
                  </div>
                </dl>
                <time dateTime={entry.dateCreated}>{formattedDate(locale, entry.dateCreated)}</time>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
