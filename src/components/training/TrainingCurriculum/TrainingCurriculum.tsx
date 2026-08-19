import { Container } from "@/components/ui/Container";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type { PublicTrainingProgram } from "@/lib/training/types";
import styles from "./TrainingCurriculum.module.css";

export async function TrainingCurriculum({
  locale,
  program
}: {
  locale: Locale;
  program: PublicTrainingProgram;
}) {
  if (program.curriculum.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "training" });

  return (
    <section className={styles.section} aria-labelledby="curriculum-heading">
      <Container>
        <div className={styles.heading}>
          <p>{t("curriculum")}</p>
          <h2 id="curriculum-heading">{t("learn")}</h2>
        </div>
        <ol className={styles.grid}>
          {program.curriculum.map((module, index) => (
            <li key={module.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{module.title}</strong>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
