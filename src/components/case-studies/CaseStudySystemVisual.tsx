import styles from "./CaseStudySystemVisual.module.css";

interface CaseStudySystemVisualProps {
  accessibleLabel: string;
  stages: readonly string[];
  compact?: boolean;
}

export function CaseStudySystemVisual({
  accessibleLabel,
  stages,
  compact = false
}: CaseStudySystemVisualProps) {
  return (
    <div
      className={styles.visual}
      data-compact={compact || undefined}
      role="img"
      aria-label={accessibleLabel}
    >
      <div className={styles.consoleHeader} aria-hidden="true">
        <span>MZ / DOC—01</span>
        <span>SYS · FLOW</span>
      </div>

      <svg className={styles.circuit} viewBox="0 0 680 360" aria-hidden="true">
        <g className={styles.gridLines}>
          <path d="M0 60H680M0 120H680M0 180H680M0 240H680M0 300H680" />
          <path d="M85 0V360M170 0V360M255 0V360M340 0V360M425 0V360M510 0V360M595 0V360" />
        </g>
        <g className={styles.goldLines}>
          <path d="M55 178H154L190 142H273" />
          <path d="M407 142H490L526 178H625" />
          <path d="M340 95V50H455" />
          <path d="M340 225V286H222" />
        </g>
        <g className={styles.violetLines}>
          <path d="M190 142V220H273" />
          <path d="M490 142V220H407" />
        </g>
        <g className={styles.core}>
          <rect x="273" y="95" width="134" height="130" rx="8" />
          <rect x="298" y="119" width="84" height="82" rx="4" />
          <path d="M319 143H361M319 159H348M319 175H357" />
        </g>
        <g className={styles.nodes}>
          <circle cx="55" cy="178" r="5" />
          <circle cx="625" cy="178" r="5" />
          <circle cx="455" cy="50" r="5" />
          <circle cx="222" cy="286" r="5" />
          <circle cx="190" cy="220" r="4" />
          <circle cx="490" cy="220" r="4" />
        </g>
      </svg>

      <ol className={styles.pipeline}>
        {stages.map((stage, index) => (
          <li key={`${index}-${stage}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{stage}</strong>
          </li>
        ))}
      </ol>
    </div>
  );
}
