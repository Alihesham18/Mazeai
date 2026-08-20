"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import styles from "./AdminUsers.module.css";

interface AdminConfirmationDialogProps {
  isOpen: boolean;
  isPending: boolean;
  eyebrow: string;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  pendingLabel: string;
  closeLabel: string;
  tone: "danger" | "success" | "warning" | "neutral";
  icon: ReactNode;
  returnFocusRef: RefObject<HTMLButtonElement>;
  onClose: () => void;
  onConfirm: () => void;
}

export function AdminConfirmationDialog({
  isOpen,
  isPending,
  eyebrow,
  title,
  description,
  cancelLabel,
  confirmLabel,
  pendingLabel,
  closeLabel,
  tone,
  icon,
  returnFocusRef,
  onClose,
  onConfirm
}: AdminConfirmationDialogProps) {
  const [isMounted, setIsMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedElement.current =
      document.activeElement instanceof HTMLElement && document.activeElement !== document.body
        ? document.activeElement
        : returnFocusRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocusedElement.current?.focus();
      previouslyFocusedElement.current = null;
    };
  }, [isOpen, returnFocusRef]);

  if (!isMounted || !isOpen) return null;

  const iconClass =
    tone === "danger"
      ? styles.statusModalIconDanger
      : tone === "success"
        ? styles.statusModalIconSuccess
        : tone === "warning"
          ? styles.statusModalIconWarning
          : styles.statusModalIconNeutral;
  const confirmClass =
    tone === "danger"
      ? styles.statusModalConfirmDanger
      : tone === "success"
        ? styles.statusModalConfirmSuccess
        : tone === "warning"
          ? styles.statusModalConfirmWarning
          : styles.statusModalConfirmNeutral;

  return createPortal(
    <div
      className={styles.statusModalOverlay}
      role="presentation"
      onMouseDown={() => {
        if (!isPending) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.statusModal}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.statusModalClose}
          onClick={onClose}
          disabled={isPending}
          aria-label={closeLabel}
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className={`${styles.statusModalIcon} ${iconClass}`} aria-hidden="true">
          {icon}
        </div>
        <div className={styles.statusModalCopy}>
          <p className={styles.statusModalEyebrow}>{eyebrow}</p>
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
        </div>
        <div className={styles.statusModalActions}>
          <button
            type="button"
            className={styles.statusModalCancel}
            onClick={onClose}
            disabled={isPending}
          >
            {cancelLabel}
          </button>
          <button type="button" className={confirmClass} onClick={onConfirm} disabled={isPending}>
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
