import { TechnicalDetail, TechnicalLabel } from "@/components/ui/TechnicalDetail";
import styles from "./MazeHeroGraphic.module.css";

export function MazeHeroGraphic({ label, systemLabel }: { label: string; systemLabel: string }) {
  return (
    <div className={styles.graphic} role="img" aria-label={label}>
      <TechnicalDetail variant="grid" className={styles.grid} />
      <TechnicalDetail variant="mazeCorner" className={styles.cornerStart} />
      <TechnicalDetail variant="mazeCorner" className={styles.cornerEnd} />

      <div className={styles.frame} aria-hidden="true">
        <div className={styles.frameHeader}>
          <span>00.41 / 29.03</span>
          <span>MZ—01</span>
        </div>

        <svg className={styles.maze} viewBox="0 0 640 520" focusable="false">
          <g className={styles.structure}>
            <path d="M74 70h178v62H138v70h82v70H74v112h102v66" />
            <path d="M566 70H388v62h114v70h-82v70h146v112H464v66" />
            <path d="M252 70v58h136V70" />
            <path d="M220 202h72v-74M420 202h-72v-74" />
            <path d="M220 272h72v112H176M420 272h-72v112h116" />
            <path d="M252 450v-66h136v66" />
          </g>

          <g className={styles.signalPaths}>
            <path d="M74 70h178v58h68v86" />
            <path d="M566 202h-146v70h-72v112h116v66" />
            <path d="M176 450v-66h116v-112h28" />
          </g>

          <g className={styles.core}>
            <rect x="258" y="202" width="124" height="116" rx="4" />
            <path d="M282 230h76v60h-76zM302 250h36v20h-36z" />
            <path d="M320 202v-25M320 343v-25M258 260h-25M407 260h-25" />
          </g>

          <g className={styles.nodes}>
            <circle cx="74" cy="70" r="5" />
            <circle cx="566" cy="202" r="5" />
            <circle cx="176" cy="450" r="5" />
            <circle cx="464" cy="450" r="5" />
            <circle cx="320" cy="177" r="4" />
            <circle cx="407" cy="260" r="4" />
          </g>
        </svg>

        <div className={styles.axisStart}>01</div>
        <div className={styles.axisEnd}>64</div>
        <div className={styles.coreLabel}>
          <span>MZ / 01</span>
          <strong>SYS / 01</strong>
        </div>
      </div>

      <TechnicalLabel index="SYS" className={styles.systemLabel}>
        {systemLabel}
      </TechnicalLabel>
      <div className={styles.violetNode} aria-hidden="true" />
    </div>
  );
}
