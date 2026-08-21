import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./Section.module.css";

export function Section({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return <section className={[styles.section, className].filter(Boolean).join(" ")} {...props} />;
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  accent?: string;
  description?: string;
  align?: "start" | "center";
  compact?: boolean;
  children?: ReactNode;
}

export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  align = "start",
  compact = false,
  children
}: SectionHeadingProps) {
  return (
    <div
      className={[
        styles.heading,
        align === "center" ? styles.center : "",
        compact ? styles.compact : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h2 className={styles.title}>
        {title}
        {accent ? <span className={styles.accent}> {accent}</span> : null}
      </h2>
      {description ? <p className={styles.description}>{description}</p> : null}
      {children ? <div className={styles.actions}>{children}</div> : null}
    </div>
  );
}
