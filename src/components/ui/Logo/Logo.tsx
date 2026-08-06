import Link from "next/link";
import type { Locale } from "@/i18n/routing";
import styles from "./Logo.module.css";

export function Logo({ locale }: { locale: Locale }) {
  return (
    <Link href={`/${locale}`} className={styles.logo} aria-label="SynergyMazeAI home">
      <span className={styles.mark} aria-hidden="true" />
      <span className={styles.wordmark}>SynergyMazeAI</span>
    </Link>
  );
}
