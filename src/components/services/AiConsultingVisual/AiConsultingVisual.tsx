import type { ComponentPropsWithoutRef } from "react";
import styles from "./AiConsultingVisual.module.css";

export function AiConsultingVisual({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={[styles.visual, className].filter(Boolean).join(" ")}
      aria-hidden="true"
      {...props}
    >
      <svg viewBox="0 0 640 440" focusable="false">
        <g className={styles.grid}>
          <path d="M40 80H600M40 160H600M40 240H600M40 320H600" />
          <path d="M120 40V400M240 40V400M360 40V400M480 40V400" />
        </g>

        <g className={styles.routes}>
          <path d="M72 220H166L220 166H310L366 222H468L530 160H584" />
          <path d="M166 220L220 276H320L374 330H520" />
          <path d="M310 166L366 110H492" />
        </g>

        <g className={styles.secondaryRoutes}>
          <path d="M72 300H132L184 352H278" />
          <path d="M420 282H510L566 338" />
        </g>

        <g className={styles.nodes}>
          <circle cx="72" cy="220" r="7" />
          <circle cx="166" cy="220" r="7" />
          <circle cx="220" cy="166" r="7" />
          <circle cx="310" cy="166" r="7" />
          <circle cx="366" cy="222" r="7" />
          <circle cx="468" cy="222" r="7" />
          <circle cx="530" cy="160" r="7" />
          <circle cx="584" cy="160" r="7" />
          <circle cx="220" cy="276" r="7" />
          <circle cx="374" cy="330" r="7" />
          <circle cx="520" cy="330" r="7" />
          <circle cx="366" cy="110" r="7" />
          <circle cx="492" cy="110" r="7" />
        </g>

        <g className={styles.decisionBlocks}>
          <rect x="132" y="198" width="68" height="44" rx="4" />
          <rect x="278" y="143" width="64" height="46" rx="4" />
          <rect x="434" y="198" width="68" height="48" rx="4" />
          <rect x="340" y="307" width="68" height="46" rx="4" />
        </g>

        <g className={styles.cornerMarks}>
          <path d="M40 92V40H92M548 40H600V92M40 348V400H92M548 400H600V348" />
        </g>
      </svg>
    </div>
  );
}
