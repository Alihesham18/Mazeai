import type { ComponentPropsWithoutRef } from "react";
import styles from "./Container.module.css";

interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
  size?: "default" | "narrow" | "wide";
}

export function Container({ className, size = "default", ...props }: ContainerProps) {
  return (
    <div
      className={[styles.container, styles[size], className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
