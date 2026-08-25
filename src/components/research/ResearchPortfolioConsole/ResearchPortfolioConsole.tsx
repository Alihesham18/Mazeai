import styles from "./ResearchPortfolioConsole.module.css";

interface ResearchPortfolioConsoleProps {
  ariaLabel: string;
  label: string;
  status: string;
  projects: readonly string[];
}

export function ResearchPortfolioConsole({ ariaLabel, label, status, projects }: ResearchPortfolioConsoleProps) {
  return (
    <div className={styles.console} role="img" aria-label={ariaLabel}>
      <div className={styles.header} aria-hidden="true">
        <span>{label}</span>
        <span className={styles.status}>{status}</span>
      </div>
      <div className={styles.workspace} aria-hidden="true">
        <svg viewBox="0 0 900 300" focusable="false">
          <g className={styles.grid}>
            <path d="M0 50H900M0 100H900M0 150H900M0 200H900M0 250H900" />
            <path d="M75 0V300M150 0V300M225 0V300M300 0V300M375 0V300M450 0V300M525 0V300M600 0V300M675 0V300M750 0V300M825 0V300" />
          </g>
          <g className={styles.connections}>
            <path d="M450 150H190V75H90" /><path d="M450 150H260V235H120" />
            <path d="M450 150V55H610V90H810" /><path d="M450 150H650V225H815" />
          </g>
          <g className={styles.nodes}>
            <circle cx="90" cy="75" r="7" /><circle cx="120" cy="235" r="7" />
            <circle cx="810" cy="90" r="7" /><circle cx="815" cy="225" r="7" />
          </g>
          <g className={styles.core}>
            <rect x="395" y="95" width="110" height="110" rx="8" />
            <rect x="415" y="115" width="70" height="70" rx="4" />
            <path d="M435 150H465M450 135V165" />
          </g>
        </svg>
        <div className={styles.projectIndex}>
          {projects.map((project) => <span key={project}>{project}</span>)}
        </div>
      </div>
    </div>
  );
}
