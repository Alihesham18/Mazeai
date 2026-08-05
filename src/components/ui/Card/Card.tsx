import type { ComponentPropsWithoutRef } from "react";
import styles from "./Card.module.css";

interface CardProps extends ComponentPropsWithoutRef<"article"> {
  interactive?: boolean;
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <article
      className={[styles.card, interactive ? styles.interactive : "", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
