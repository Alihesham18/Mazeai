import styles from "./ResearchIntelligenceVisual.module.css";

interface ResearchIntelligenceVisualProps {
  ariaLabel: string;
  coreLabel: string;
  signalLabel: string;
  modelLabel: string;
}

export function ResearchIntelligenceVisual({ ariaLabel, coreLabel, signalLabel, modelLabel }: ResearchIntelligenceVisualProps) {
  return (
    <div className={styles.console} role="img" aria-label={ariaLabel}>
      <div className={styles.consoleHeader} aria-hidden="true">
        <span>R&amp;D / 01</span>
        <span className={styles.liveIndicator}>{signalLabel}</span>
      </div>
      <svg className={styles.visual} viewBox="0 0 620 470" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="research-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--maze-violet)" stopOpacity="0.65" />
            <stop offset="58%" stopColor="var(--maze-gold)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--maze-bg)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className={styles.gridLines}>
          <path d="M70 56H550M70 116H550M70 176H550M70 236H550M70 296H550M70 356H550M70 416H550" />
          <path d="M70 56V416M130 56V416M190 56V416M250 56V416M310 56V416M370 56V416M430 56V416M490 56V416M550 56V416" />
        </g>
        <circle className={styles.coreGlow} cx="310" cy="236" r="148" />
        <g className={styles.maze}>
          <path d="M310 116H226V158H184V236H226V314H268V356H352V314H394V272H436V194H394V158H352V116" />
          <path d="M310 158H268V194H226V278H268V314H352V278H394V194H352V158" />
          <path d="M310 194H278V226H246V268H294V298H342V268H374V204H342V236H310" />
        </g>
        <g className={styles.circuits}>
          <path d="M184 236H104V176H66" /><path d="M226 314H142V370H82" />
          <path d="M352 116V72H430V42" /><path d="M394 194H488V132H560" />
          <path d="M436 272H512V334H574" /><path d="M352 356V404H448" />
        </g>
        <g className={styles.nodes}>
          <circle cx="66" cy="176" r="5" /><circle cx="82" cy="370" r="5" />
          <circle cx="430" cy="42" r="5" /><circle cx="560" cy="132" r="5" />
          <circle cx="574" cy="334" r="5" /><circle cx="448" cy="404" r="5" />
        </g>
        <g className={styles.core}>
          <circle cx="310" cy="236" r="53" /><circle cx="310" cy="236" r="33" />
          <path d="M286 236H334M310 212V260" />
        </g>
      </svg>
      <div className={styles.readouts} aria-hidden="true">
        <span><b>01</b>{coreLabel}</span><span><b>02</b>{modelLabel}</span>
      </div>
    </div>
  );
}
