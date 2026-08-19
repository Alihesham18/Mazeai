import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./page.module.css";

export default async function TrainingApplicationSuccess({ params }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "training" });
  return (
    <section className={styles.success}>
      <Container className={styles.wrap}>
        <CheckCircle2 size={52} aria-hidden="true" />
        <p>{t("application")}</p>
        <h1>{t("successTitle")}</h1>
        <span>{t("successDescription")}</span>
        <Link
          href={localizedPath(
            params.locale,
            "/training/data-science-machine-learning"
          )}
        >
          {t("returnCourse")}
        </Link>
      </Container>
    </section>
  );
}
