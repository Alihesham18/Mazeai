import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./TechnicalDetail.module.css";

export type TechnicalDetailVariant =
  "line" | "circuit" | "grid" | "dots" | "mazeCorner" | "brackets";

interface TechnicalDetailProps extends ComponentPropsWithoutRef<"div"> {
  variant?: TechnicalDetailVariant;
  decorative?: boolean;
}

export function TechnicalDetail({
  variant = "line",
  decorative = true,
  className,
  ...props
}: TechnicalDetailProps) {
  return (
    <div
      className={[styles.detail, styles[variant], className].filter(Boolean).join(" ")}
      aria-hidden={decorative || undefined}
      {...props}
    />
  );
}

interface TechnicalLabelProps extends ComponentPropsWithoutRef<"span"> {
  index?: string;
  children: ReactNode;
}

export function TechnicalLabel({ index, className, children, ...props }: TechnicalLabelProps) {
  return (
    <span className={[styles.label, className].filter(Boolean).join(" ")} {...props}>
      {index ? <span className={styles.index}>{index}</span> : null}
      <span>{children}</span>
    </span>
  );
}
