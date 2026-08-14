"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./CopyDiscountCode.module.css";

export function CopyDiscountCode({
  code,
  copyLabel,
  copiedLabel
}: {
  code: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    []
  );

  async function copyCode() {
    if (!navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className={styles.button} type="button" onClick={copyCode}>
      {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      <span aria-live="polite">{copied ? copiedLabel : copyLabel}</span>
    </button>
  );
}
