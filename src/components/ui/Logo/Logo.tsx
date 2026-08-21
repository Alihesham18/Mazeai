import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/routing";
import styles from "./Logo.module.css";

export function Logo({ locale }: { locale: Locale }) {
  return (
    <Link href={`/${locale}`} className={styles.logo} aria-label="SynergyMazeAI">
      <span className={styles.mark} aria-hidden="true">
        <Image
          src="/images/branding/synergymazeai-logo.png"
          alt=""
          width={44}
          height={44}
          className={styles.image}
          priority
        />
      </span>
      <span className={styles.wordmark}>SynergyMazeAI</span>
    </Link>
  );
}
