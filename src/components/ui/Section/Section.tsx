import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./Section.module.css";

export function Section({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return <section className={[styles.section, className].filter(Boolean).join(" ")} {...props} />;
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  children?: ReactNode;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  children
}: SectionHeadingProps) {
  return (
    <div className={[styles.heading, align === "center" ? styles.center : ""].join(" ")}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? <p className={styles.description}>{description}</p> : null}
      {children}
    </div>
  );
}
