import { Container } from "@/components/ui/Container";
import { trainingCopy, type TrainingProgram } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/utilities/localize";
import styles from "./TrainingCurriculum.module.css";

export function TrainingCurriculum({
  locale,
  program
}: {
  locale: Locale;
  program: TrainingProgram;
}) {
  return (
    <section className={styles.section} aria-labelledby="curriculum-heading">
      <Container>
        <div className={styles.heading}>
          <p>{localize(trainingCopy.curriculum, locale)}</p>
          <h2 id="curriculum-heading">{localize(trainingCopy.learn, locale)}</h2>
        </div>
        <ol className={styles.grid}>
          {program.curriculum.map((module, index) => (
            <li key={module.title.en}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{localize(module.title, locale)}</strong>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
