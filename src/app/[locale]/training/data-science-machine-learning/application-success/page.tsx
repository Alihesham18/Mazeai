import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getTrainingProgram, trainingCopy } from "@/data/training-programs";
import type { Locale } from "@/i18n/routing";
import { localize, localizedPath } from "@/lib/utilities/localize";
import styles from "./page.module.css";

const program = getTrainingProgram("data-science-machine-learning");

export default function TrainingApplicationSuccess({ params }: { params: { locale: Locale } }) {
  return (
    <section className={styles.success}>
      <Container className={styles.wrap}>
        <CheckCircle2 size={52} aria-hidden="true" />
        <p>{localize(trainingCopy.application, params.locale)}</p>
        <h1>{localize(trainingCopy.successTitle, params.locale)}</h1>
        <span>{localize(trainingCopy.successDescription, params.locale)}</span>
        <Link
          href={localizedPath(
            params.locale,
            `/training/${program?.slug ?? "data-science-machine-learning"}`
          )}
        >
          {localize(trainingCopy.returnCourse, params.locale)}
        </Link>
      </Container>
    </section>
  );
}
