import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/routing";
import { localizedPath } from "@/lib/utilities/localize";

export default function ResearchPrototypeClinicRegisterPage({ params }: { params: { locale: Locale } }) {
  redirect(`${localizedPath(params.locale, "/events/research-prototype-clinic")}#registration`);
}
