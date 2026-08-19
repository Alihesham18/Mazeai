import { Container } from "@/components/ui/Container";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type { PublicTrainingProgram } from "@/lib/training/types";
import styles from "./TrainingTimeline.module.css";

export async function TrainingTimeline({
  locale,
  program
}: {
  locale: Locale;
  program: PublicTrainingProgram;
}) {
  if (program.weeklyPlan.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "training" });

  return (
    <section className={styles.section} aria-labelledby="weekly-plan-heading">
      <Container>
        <div className={styles.heading}>
          <p>{t("weeklyPlan")}</p>
          <h2 id="weekly-plan-heading">{t("weeklyProgress")}</h2>
        </div>
        <ol className={styles.list}>
          {program.weeklyPlan.map((week, index) => (
            <li key={week.id}>
              <span className={styles.number}>{index + 1}</span>
              <div>
                <small>
                  {t("week")} {index + 1}
                </small>
                <strong>{week.title}</strong>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
