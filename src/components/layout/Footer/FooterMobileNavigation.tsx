"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./Footer.module.css";

interface FooterMobileGroup {
  id: string;
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
}

export function FooterMobileNavigation({
  ariaLabel,
  groups
}: {
  ariaLabel: string;
  groups: FooterMobileGroup[];
}) {
  const panelIdPrefix = useId();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <nav className={styles.mobileNavigation} aria-label={ariaLabel}>
      {groups.map((group) => {
        const isOpen = openGroup === group.id;
        const panelId = `${panelIdPrefix}-${group.id}`;

        return (
          <div className={styles.mobileGroup} key={group.id}>
            <button
              type="button"
              className={styles.mobileToggle}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenGroup(isOpen ? null : group.id)}
            >
              <span>{group.title}</span>
              <ChevronDown
                aria-hidden="true"
                className={isOpen ? styles.mobileChevronOpen : styles.mobileChevron}
                size={18}
              />
            </button>
            <div className={styles.mobileLinks} id={panelId} hidden={!isOpen}>
              {group.links.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
