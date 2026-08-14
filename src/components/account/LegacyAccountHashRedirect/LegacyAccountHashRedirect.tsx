"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";

const destinations: Record<string, string> = {
  profile: "/account/profile",
  applications: "/account/training-applications",
  "training-applications": "/account/training-applications",
  "scholarship-exams": "/account/scholarship-exams",
  trainings: "/account/my-trainings",
  "my-trainings": "/account/my-trainings",
  "event-registrations": "/account/event-registrations"
};

export function LegacyAccountHashRedirect({ locale }: { locale: Locale }) {
  const router = useRouter();

  useEffect(() => {
    const destination = destinations[window.location.hash.slice(1)];
    if (destination) router.replace(localizedPath(locale, destination));
  }, [locale, router]);

  return null;
}
