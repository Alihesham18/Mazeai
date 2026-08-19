import {
  Award,
  BookOpenCheck,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  FlaskConical,
  GraduationCap,
  History,
  LayoutDashboard,
  Newspaper,
  TicketPercent,
  Users
} from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";

export interface AdminNavigationItem {
  labelKey: string;
  path: string;
  icon: typeof LayoutDashboard;
}

export interface AdminNavigationGroup {
  labelKey: string | null;
  items: AdminNavigationItem[];
}

export const adminNavigationGroups: AdminNavigationGroup[] = [
  {
    labelKey: null,
    items: [{ labelKey: "navigation.dashboard", path: "/admin", icon: LayoutDashboard }]
  },
  {
    labelKey: "groups.people",
    items: [{ labelKey: "navigation.users", path: "/admin/users", icon: Users }]
  },
  {
    labelKey: "groups.training",
    items: [
      {
        labelKey: "navigation.trainingPrograms",
        path: "/admin/training/programs",
        icon: GraduationCap
      },
      {
        labelKey: "navigation.trainingApplications",
        path: "/admin/training/applications",
        icon: ClipboardList
      },
      {
        labelKey: "navigation.enrolledTrainings",
        path: "/admin/training/enrollments",
        icon: BookOpenCheck
      },
      {
        labelKey: "navigation.scholarships",
        path: "/admin/scholarships",
        icon: Award
      },
      {
        labelKey: "navigation.discountCodes",
        path: "/admin/discounts",
        icon: TicketPercent
      }
    ]
  },
  {
    labelKey: "groups.events",
    items: [
      { labelKey: "navigation.events", path: "/admin/events", icon: CalendarDays },
      {
        labelKey: "navigation.eventRegistrations",
        path: "/admin/events/registrations",
        icon: CalendarCheck
      }
    ]
  },
  {
    labelKey: "groups.content",
    items: [
      { labelKey: "navigation.caseStudies", path: "/admin/case-studies", icon: FileText },
      { labelKey: "navigation.blog", path: "/admin/blog", icon: Newspaper },
      { labelKey: "navigation.research", path: "/admin/research", icon: FlaskConical }
    ]
  },
  {
    labelKey: "groups.system",
    items: [{ labelKey: "navigation.activity", path: "/admin/activity", icon: History }]
  }
];

export const adminNavigationItems = adminNavigationGroups.flatMap((group) => group.items);

function normalizedPath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

export function getActiveAdminNavigationItem(pathname: string, locale: Locale) {
  const currentPath = normalizedPath(pathname);

  return (
    [...adminNavigationItems]
      .sort((left, right) => right.path.length - left.path.length)
      .find((item) => {
        const href = localizedPath(locale, item.path);
        return item.path === "/admin"
          ? currentPath === href
          : currentPath === href || currentPath.startsWith(`${href}/`);
      }) ?? null
  );
}
