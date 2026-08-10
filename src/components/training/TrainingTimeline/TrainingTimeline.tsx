import { Container } from "@/components/ui/Container";
import { trainingCopy, type TrainingProgram } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/utilities/localize";
import styles from "./TrainingTimeline.module.css";

export function TrainingTimeline({
  locale,
  program
}: {
  locale: Locale;
  program: TrainingProgram;
}) {
  return (
    <section className={styles.section} aria-labelledby="weekly-plan-heading">
      <Container>
        <div className={styles.heading}>
          <p>{localize(trainingCopy.weeklyPlan, locale)}</p>
          <h2 id="weekly-plan-heading">{localize(trainingCopy.weeklyProgress, locale)}</h2>
        </div>
        <ol className={styles.list}>
          {program.weeks.map((week, index) => (
            <li key={week.title.en}>
              <span className={styles.number}>{index + 1}</span>
              <div>
                <small>
                  {localize(trainingCopy.week, locale)} {index + 1}
                </small>
                <strong>{localize(week.title, locale)}</strong>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
