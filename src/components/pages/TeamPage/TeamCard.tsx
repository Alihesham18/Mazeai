import { ArrowUpRight, Linkedin } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { TeamMember } from "@/lib/directus/team";
import styles from "./TeamPage.module.css";

interface TeamCardProps {
  member: TeamMember;
  categoryLabel: string;
  linkedinLabel: string;
  linkedinAriaLabel: string;
  index: number;
}

export function TeamCard({
  member,
  categoryLabel,
  linkedinLabel,
  linkedinAriaLabel,
  index
}: TeamCardProps) {
  return (
    <article className={styles.card} style={{ "--card-index": index } as CSSProperties}>
      <div className={styles.portraitPanel}>
        <div className={styles.portraitFrame}>
          {member.photoUrl ? (
            <Image
              className={styles.portrait}
              src={member.photoUrl}
              alt={member.photoAlt}
              fill
              quality={92}
              sizes="(max-width: 767px) 14rem, (max-width: 1279px) 17rem, 14rem"
            />
          ) : (
            <div className={styles.portraitUnavailable} aria-hidden="true" />
          )}
        </div>
      </div>

      <div className={styles.cardContent}>
        <p className={styles.category}>
          <span className={styles.cardIndex} aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className={styles.categorySeparator} aria-hidden="true">
            /
          </span>
          <span>{categoryLabel}</span>
        </p>
        <h3>{member.fullName}</h3>
        <p className={styles.role}>{member.jobTitle}</p>
        <span className={styles.rule} aria-hidden="true" />
        <p className={styles.bio}>{member.bio}</p>

        {member.expertise.length > 0 ? (
          <ul className={styles.expertise} aria-label={member.expertise.join(", ")}>
            {member.expertise.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}

        {member.linkedinUrl ? (
          <a
            className={styles.linkedin}
            href={member.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={linkedinAriaLabel}
          >
            <Linkedin size={17} aria-hidden="true" />
            <span>{linkedinLabel}</span>
            <ArrowUpRight className={styles.directionalIcon} size={17} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
