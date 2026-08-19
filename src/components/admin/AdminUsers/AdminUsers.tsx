import { ArrowLeft, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import {
  adminUserStatuses,
  type AdminUserStatus,
  type AdminUserSummary,
  type AdminUsersResult
} from "@/lib/directus/admin-users";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./AdminUsers.module.css";

const statusKeys: Record<AdminUserStatus, string> = {
  active: "users.statuses.active",
  invited: "users.statuses.invited",
  draft: "users.statuses.draft",
  suspended: "users.statuses.suspended",
  archived: "users.statuses.archived"
};

function userName(user: AdminUserSummary) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ");
}

function initials(user: AdminUserSummary) {
  return (
    `${user.firstName.slice(0, 1)}${user.lastName.slice(0, 1)}`.toUpperCase() ||
    user.email.slice(0, 1).toUpperCase()
  );
}

function formattedDate(locale: Locale, value: string | null) {
  return value
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(value)
      )
    : null;
}

function usersHref(
  locale: Locale,
  input: { page?: number; query?: string; status?: AdminUserStatus | null }
) {
  const parameters = new URLSearchParams();
  if (input.query) parameters.set("q", input.query);
  if (input.status) parameters.set("status", input.status);
  if (input.page && input.page > 1) parameters.set("page", String(input.page));
  const queryString = parameters.toString();
  const path = localizedPath(locale, "/admin/users");
  return queryString ? `${path}?${queryString}` : path;
}

function StatusBadge({ status, label }: { status: AdminUserStatus | null; label: string }) {
  return (
    <span className={styles.statusBadge} data-status={status ?? "unavailable"}>
      {label}
    </span>
  );
}

export async function AdminUsers({ locale, result }: { locale: Locale; result: AdminUsersResult }) {
  const t = await getTranslations({ locale, namespace: "adminAuth" });
  const query = result.query;
  const unavailable = t("users.unavailable");

  return (
    <div className={styles.directory}>
      <header className={styles.heading}>
        <p>{t("title")}</p>
        <h1>{t("users.management")}</h1>
        <span>{t("users.description")}</span>
      </header>

      <form className={styles.filters} action={localizedPath(locale, "/admin/users")} method="get">
        <label className={styles.searchField}>
          <span>{t("users.searchUsers")}</span>
          <span className={styles.inputControl}>
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              name="q"
              defaultValue={query.query}
              placeholder={t("users.searchPlaceholder")}
              maxLength={100}
            />
          </span>
        </label>
        <label className={styles.statusField}>
          <span>{t("users.status")}</span>
          <select name="status" defaultValue={query.status ?? ""}>
            <option value="">{t("users.allStatuses")}</option>
            {adminUserStatuses.map((status) => (
              <option key={status} value={status}>
                {t(statusKeys[status])}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">{t("users.search")}</button>
        {query.query || query.status ? (
          <Link className={styles.clearLink} href={localizedPath(locale, "/admin/users")}>
            {t("users.clearFilters")}
          </Link>
        ) : null}
      </form>

      {result.state === "unavailable" ? (
        <section className={styles.messagePanel} role="status">
          <UserRound aria-hidden="true" />
          <h2>{t("users.unavailableTitle")}</h2>
          <p>{t("users.unavailableMessage")}</p>
        </section>
      ) : result.users.length === 0 ? (
        <section className={styles.messagePanel}>
          <UserRound aria-hidden="true" />
          <h2>{t("users.noUsersFound")}</h2>
          <p>{t("users.noUsersMessage")}</p>
        </section>
      ) : (
        <>
          <section className={styles.tablePanel} aria-label={t("users.management")}>
            <div className={styles.resultSummary}>
              {t("users.totalResults", { count: result.totalCount })}
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">{t("users.name")}</th>
                    <th scope="col">{t("users.email")}</th>
                    <th scope="col">{t("users.accountNumber")}</th>
                    <th scope="col">{t("users.status")}</th>
                    <th scope="col">{t("users.lastAccess")}</th>
                    <th scope="col">{t("users.role")}</th>
                    <th scope="col">
                      <span className={styles.visuallyHidden}>{t("users.actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.users.map((user) => {
                    const statusLabel = user.status ? t(statusKeys[user.status]) : unavailable;
                    return (
                      <tr key={user.id}>
                        <td>
                          <span className={styles.nameCell}>
                            <span className={styles.avatar} aria-hidden="true">
                              {initials(user)}
                            </span>
                            <strong>{userName(user) || unavailable}</strong>
                          </span>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.accountNumber ?? unavailable}</td>
                        <td>
                          <StatusBadge status={user.status} label={statusLabel} />
                        </td>
                        <td>{formattedDate(locale, user.lastAccess) ?? unavailable}</td>
                        <td>{t("users.roles.websiteUser")}</td>
                        <td>
                          <Link href={localizedPath(locale, `/admin/users/${user.id}`)}>
                            {t("users.viewDetails")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileCards}>
              {result.users.map((user) => {
                const statusLabel = user.status ? t(statusKeys[user.status]) : unavailable;
                return (
                  <article key={user.id}>
                    <div className={styles.mobileIdentity}>
                      <span className={styles.avatar} aria-hidden="true">
                        {initials(user)}
                      </span>
                      <span>
                        <strong>{userName(user) || unavailable}</strong>
                        <small>{user.email}</small>
                      </span>
                      <StatusBadge status={user.status} label={statusLabel} />
                    </div>
                    <dl>
                      <div>
                        <dt>{t("users.accountNumber")}</dt>
                        <dd>{user.accountNumber ?? unavailable}</dd>
                      </div>
                      <div>
                        <dt>{t("users.lastAccess")}</dt>
                        <dd>{formattedDate(locale, user.lastAccess) ?? unavailable}</dd>
                      </div>
                      <div>
                        <dt>{t("users.role")}</dt>
                        <dd>{t("users.roles.websiteUser")}</dd>
                      </div>
                    </dl>
                    <Link href={localizedPath(locale, `/admin/users/${user.id}`)}>
                      {t("users.viewDetails")}
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>

          <nav className={styles.pagination} aria-label={t("users.paginationLabel")}>
            {query.page > 1 ? (
              <Link
                href={usersHref(locale, {
                  page: query.page - 1,
                  query: query.query,
                  status: query.status
                })}
              >
                {t("users.previous")}
              </Link>
            ) : (
              <span aria-disabled="true">{t("users.previous")}</span>
            )}
            <strong>{t("users.pageOf", { page: query.page, pages: result.totalPages })}</strong>
            {query.page < result.totalPages ? (
              <Link
                href={usersHref(locale, {
                  page: query.page + 1,
                  query: query.query,
                  status: query.status
                })}
              >
                {t("users.next")}
              </Link>
            ) : (
              <span aria-disabled="true">{t("users.next")}</span>
            )}
          </nav>
        </>
      )}
    </div>
  );
}

export async function AdminUserDetail({
  locale,
  user
}: {
  locale: Locale;
  user: AdminUserSummary | null;
}) {
  const t = await getTranslations({ locale, namespace: "adminAuth" });
  const unavailable = t("users.unavailable");

  if (!user) {
    return (
      <div className={styles.directory}>
        <Link className={styles.backLink} href={localizedPath(locale, "/admin/users")}>
          <ArrowLeft className={styles.backIcon} size={17} aria-hidden="true" />
          {t("users.backToUsers")}
        </Link>
        <section className={styles.messagePanel} role="status">
          <UserRound aria-hidden="true" />
          <h1>{t("users.unavailableTitle")}</h1>
          <p>{t("users.unavailableMessage")}</p>
        </section>
      </div>
    );
  }

  const statusLabel = user.status ? t(statusKeys[user.status]) : unavailable;
  return (
    <div className={styles.directory}>
      <Link className={styles.backLink} href={localizedPath(locale, "/admin/users")}>
        <ArrowLeft className={styles.backIcon} size={17} aria-hidden="true" />
        {t("users.backToUsers")}
      </Link>
      <header className={styles.detailHeading}>
        <span className={styles.detailAvatar} aria-hidden="true">
          {initials(user)}
        </span>
        <span>
          <p>{t("users.userDetails")}</p>
          <h1>{userName(user) || user.email}</h1>
          <small>{user.email}</small>
        </span>
        <StatusBadge status={user.status} label={statusLabel} />
      </header>

      <section className={styles.detailPanel} aria-labelledby="admin-user-account">
        <h2 id="admin-user-account">{t("users.account")}</h2>
        <dl>
          <div>
            <dt>{t("users.name")}</dt>
            <dd>{userName(user) || unavailable}</dd>
          </div>
          <div>
            <dt>{t("users.email")}</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>{t("users.accountNumber")}</dt>
            <dd>{user.accountNumber ?? unavailable}</dd>
          </div>
          <div>
            <dt>{t("users.status")}</dt>
            <dd>{statusLabel}</dd>
          </div>
          <div>
            <dt>{t("users.lastAccess")}</dt>
            <dd>{formattedDate(locale, user.lastAccess) ?? unavailable}</dd>
          </div>
          <div>
            <dt>{t("users.role")}</dt>
            <dd>{t("users.roles.websiteUser")}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
