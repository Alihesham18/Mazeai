import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import styles from "./AuthShell.module.css";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  supporting: string;
  children: ReactNode;
}

export function AuthShell({ eyebrow, title, supporting, children }: AuthShellProps) {
  return (
    <section className={styles.page}>
      <Container className={styles.container}>
        <header className={styles.heading}>
          <p>{eyebrow}</p>
          <h1>{title}</h1>
          <span>{supporting}</span>
        </header>
        <div className={styles.formFrame}>{children}</div>
      </Container>
    </section>
  );
}
