"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={[styles.toggle, className].filter(Boolean).join(" ")}
      aria-label="Toggle color theme"
      title="Toggle color theme"
      onClick={toggleTheme}
    >
      <Sun className={styles.darkIcon} size={20} aria-hidden="true" />
      <Moon className={styles.lightIcon} size={20} aria-hidden="true" />
    </button>
  );
}
