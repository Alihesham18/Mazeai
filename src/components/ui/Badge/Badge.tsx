import type { ComponentPropsWithoutRef } from "react";
import styles from "./Badge.module.css";

export function Badge({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return <span className={[styles.badge, className].filter(Boolean).join(" ")} {...props} />;
}
