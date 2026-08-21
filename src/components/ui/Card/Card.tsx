import type { ComponentPropsWithoutRef } from "react";
import styles from "./Card.module.css";

interface CardProps extends ComponentPropsWithoutRef<"article"> {
  interactive?: boolean;
  variant?: "standard" | "featured" | "technical";
}

export function Card({ className, interactive, variant = "standard", ...props }: CardProps) {
  return (
    <article
      className={[styles.card, styles[variant], interactive ? styles.interactive : "", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
