import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import styles from "./AdminPlaceholder.module.css";

interface AdminPlaceholderProps {
  locale: Locale;
  titleKey: string;
  dashboard?: boolean;
}

export async function AdminPlaceholder({
  locale,
  titleKey,
  dashboard = false
}: AdminPlaceholderProps) {
  const t = await getTranslations({ locale, namespace: "adminAuth" });

  return (
    <section className={styles.placeholder} aria-labelledby="admin-page-title">
      <p className={styles.eyebrow}>{t("title")}</p>
      <h1 id="admin-page-title">{t(titleKey)}</h1>
      <p>{t(dashboard ? "dashboardPlaceholder" : "managementPlaceholder")}</p>
    </section>
  );
}
