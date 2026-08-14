"use client";

import {
  BookOpenCheck,
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
  Medal,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";
import styles from "./AccountSectionNavigation.module.css";

export function AccountSectionNavigation({ locale }: { locale: Locale }) {
  const t = useTranslations("auth");
  const pathname = (usePathname() ?? "").replace(/\/$/, "");
  const items = [
    { label: t("overview"), path: "/account", icon: LayoutDashboard },
    { label: t("profile"), path: "/account/profile", icon: UserRound },
    {
      label: t("trainingApplications"),
      path: "/account/training-applications",
      icon: ClipboardList
    },
    {
      label: t("scholarshipExams"),
      path: "/account/scholarship-exams",
      icon: Medal
    },
    { label: t("myTrainings"), path: "/account/my-trainings", icon: BookOpenCheck },
    {
      label: t("eventRegistrations"),
      path: "/account/event-registrations",
      icon: CalendarCheck
    }
  ];

  return (
    <div className={styles.viewport}>
      <nav className={styles.navigation} aria-label={t("accountSections")}>
        {items.map(({ label, path, icon: Icon }) => {
          const href = localizedPath(locale, path);
          const changePasswordPath = localizedPath(locale, "/account/change-password");
          const active =
            pathname === href || (path === "/account/profile" && pathname === changePasswordPath);
          return (
            <Link
              key={path}
              href={href}
              className={active ? styles.active : styles.link}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
