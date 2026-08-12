"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ComponentPropsWithoutRef } from "react";
import styles from "./PasswordInput.module.css";

type PasswordInputProps = Omit<ComponentPropsWithoutRef<"input">, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const t = useTranslations("auth");
  const [isVisible, setIsVisible] = useState(false);
  const label = isVisible ? t("hidePassword") : t("showPassword");
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className={styles.root}>
      <input
        {...props}
        className={[styles.input, className].filter(Boolean).join(" ")}
        type={isVisible ? "text" : "password"}
      />
      <button
        type="button"
        className={styles.toggle}
        aria-label={label}
        aria-controls={props.id}
        aria-pressed={isVisible}
        onClick={() => setIsVisible((visible) => !visible)}
      >
        <Icon size={19} aria-hidden="true" />
      </button>
    </div>
  );
}
