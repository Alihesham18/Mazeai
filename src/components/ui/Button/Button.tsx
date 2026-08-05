import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
}

export function Button({ href, variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <Link
      href={href}
      className={[styles.button, styles[variant], className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </Link>
  );
}
