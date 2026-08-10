"use client";

import { usePathname } from "next/navigation";
import styles from "./PageBackground.module.css";

type BackgroundVariant =
  | "services"
  | "training"
  | "research"
  | "events"
  | "case-studies"
  | "blog"
  | "about"
  | "contact"
  | "default";

const routeVariants: Array<[string, BackgroundVariant]> = [
  ["services", "services"],
  ["training", "training"],
  ["research", "research"],
  ["events", "events"],
  ["case-studies", "case-studies"],
  ["blog", "blog"],
  ["about", "about"],
  ["contact", "contact"]
];

function getVariant(pathname: string): BackgroundVariant {
  const route = pathname.split("/").filter(Boolean).slice(1).join("/");
  return routeVariants.find(([prefix]) => route.startsWith(prefix))?.[1] ?? "default";
}

export function PageBackground() {
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  const route = currentPath.split("/").filter(Boolean);

  if (route.length <= 1) {
    return null;
  }

  return (
    <div
      className={styles.background}
      data-variant={getVariant(currentPath)}
      data-testid="page-background"
      aria-hidden="true"
    >
      <div className={styles.ambient} />
      <div className={styles.grid} />
      <div className={styles.circuit} />
      <div className={styles.nodes} />
      <div className={styles.vignette} />
    </div>
  );
}
