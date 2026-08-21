"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "outline" | "secondary" | "text" | "ghost";

interface SharedButtonProps {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}

type LinkButtonProps = SharedButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href"> & {
    href: string;
    disabled?: boolean;
  };

type NativeButtonProps = SharedButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    href?: never;
  };

export type ButtonProps = LinkButtonProps | NativeButtonProps;

function buttonContent(children: ReactNode, loading: boolean, loadingLabel?: string) {
  return (
    <>
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </>
  );
}

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    className,
    children,
    loading = false,
    loadingLabel,
    ...rest
  } = props;
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(" ");

  if ("href" in rest && typeof rest.href === "string") {
    const { disabled = false, onClick, href, tabIndex, ...anchorProps } = rest;
    const unavailable = disabled || loading;

    return (
      <Link
        href={href}
        className={classes}
        aria-busy={loading || undefined}
        aria-disabled={unavailable || undefined}
        tabIndex={unavailable ? -1 : tabIndex}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          if (unavailable) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        {...anchorProps}
      >
        {buttonContent(children, loading, loadingLabel)}
      </Link>
    );
  }

  const { disabled = false, type = "button", ...buttonProps } = rest as NativeButtonProps;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...buttonProps}
    >
      {buttonContent(children, loading, loadingLabel)}
    </button>
  );
}
